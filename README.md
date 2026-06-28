# Tea-It-Up Backend — Local Setup Guide

Express + TypeScript + MongoDB API for the Tea-It-Up golf tee-time booking
platform. This document covers everything needed to run the project on your
own machine. For *why* things are designed the way they are, see
[ARCHITECTURE.md](./ARCHITECTURE.md). For running this in production, see
[DEPLOYMENT.md](./DEPLOYMENT.md).

## 1. Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20.x | matches the Docker image; anything 18+ works |
| npm | bundled with Node | |
| MongoDB | 7.x | **must run as a replica set** — see §3, this is not optional |
| Docker (optional) | any recent version | easiest way to satisfy the MongoDB requirement |

### Why MongoDB must be a replica set, even locally

Two flows in this API use multi-document transactions — `bookings` (atomic
"check capacity, then create the booking" so two players can never both grab
the last slot) and `golfCourses` (atomically creating a new club-owner
account together with their course). MongoDB only supports transactions on a
replica set, even a single-node one. A plain standalone `mongod` will throw
`Transaction numbers are only allowed on a replica set member` the first
time you hit either of those endpoints. §3 below sets this up in under a
minute either way you choose.

## 2. Install dependencies

```bash
cd tea-it-up-backend
npm install
```

## 3. Get a MongoDB replica set running

Pick **one** of these three options.

### Option A — Docker, single command (recommended)

```bash
docker run -d --name tea-it-up-mongo -p 27017:27017 mongo:7 --replSet rs0
docker exec tea-it-up-mongo mongosh --eval "rs.initiate()"
```

That's it — `mongodb://localhost:27017/tea-it-up?replicaSet=rs0` is now live.
To stop/start it later: `docker stop tea-it-up-mongo` / `docker start tea-it-up-mongo`.

### Option B — Full docker-compose stack (mongo + the API + nginx)

If you'd rather run the whole backend in containers instead of `npm run dev`
on bare metal, skip straight to `docker compose up -d --build` — see
[DEPLOYMENT.md](./DEPLOYMENT.md) §3-4 for the `.env` setup it expects. This
also auto-initiates the replica set via a healthcheck, so you don't need the
`mongosh rs.initiate()` step above.

### Option C — MongoDB Atlas free tier (no local install at all)

Atlas clusters are *always* provisioned as replica sets, so a free M0
cluster works with zero extra setup. Create one at mongodb.com, grab its
connection string, and use that directly as `DATABASE_URL` in §4 — skip
Options A/B entirely.

### Option D — Local MongoDB install, manually as a replica set

If you have `mongod` installed natively (not via Docker):

```bash
mongod --dbpath /path/to/your/data/dir --replSet rs0
# in another terminal:
mongosh --eval "rs.initiate()"
```

## 4. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | What to put |
|---|---|
| `DATABASE_URL` | `mongodb://localhost:27017/tea-it-up?replicaSet=rs0` (Option A/D) or your Atlas URI (Option C) |
| `JWT_ACCESS_SECRET` | a random string, 16+ chars — generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | a **different** random string, same way |
| `COOKIE_SECRET` | another random string, same way |
| `CLIENT_WEBSITE_URL` | where `tea-it-up-website` runs, e.g. `http://localhost:3000` |
| `CLIENT_DASHBOARD_URL` | where `tea-it-up-dashboard` runs, e.g. `http://localhost:3001` (it actually runs on 3001/3002 in dev if 3000 is taken — match whatever port it's actually on, since CORS will reject anything not in this list) |

Everything else in `.env.example` already has sane defaults for local dev —
leave `MEDIA_PROVIDER=LOCAL` and the rest as-is unless you know you want
something different.

No `.env` → the app refuses to start and prints exactly which variables are
missing/invalid (see `src/app/config/env.ts`) — that's intentional, not a bug.

## 5. Run it

```bash
npm run dev
```

You should see:

```
[timestamp] info: MongoDB connected
[timestamp] info: Tea-It-Up backend listening on port 5000 (development)
```

`ts-node-dev` watches `src/` and restarts automatically on save.

## 6. Confirm it's working

```bash
curl http://localhost:5000/health
```

Expected:
```json
{"success":true,"statusCode":200,"message":"OK","data":{"uptime":12.34}}
```

## 7. Bootstrapping your first admin account

Every account created through `POST /api/v1/auth/register` is a plain
`USER` (player) — that's by design, staff accounts aren't self-serve. The
**first** `ADMIN` has to be created manually once:

```bash
# 1. Register a normal account through the API
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Platform Admin","email":"admin@teaitup.com","password":"Admin@123"}'

# 2. Promote that one user to ADMIN directly in the database
mongosh "mongodb://localhost:27017/tea-it-up" --eval \
  'db.users.updateOne({ email: "admin@teaitup.com" }, { $set: { role: "ADMIN" } })'
```

Log in again after the promotion (`POST /auth/login`) — the role is baked
into the access token at login time, so the old token from step 1 is still
just a `USER` token.

Once you have one `ADMIN`, that account can create club-owner accounts
through `POST /api/v1/courses` (the "Create New Club" flow) — no more manual
DB edits needed after this.

## 8. A full smoke-test walkthrough (curl)

With an admin token from §7 (`TOKEN` below is the `accessToken` from the
login response):

```bash
# Create a club — provisions a COURSE_MANAGER account + a PENDING course
curl -X POST http://localhost:5000/api/v1/courses \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Pinecrest Valley Links","email":"owner@pinecrest.com","password":"Owner@123"}'

# Log in as that new owner — this succeeds (200) and returns
# data.user.mustResetPassword: true. The access token works for
# /auth/change-password ONLY; every other authenticated route will
# 403 "You must change your password before continuing" until you do.
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@pinecrest.com","password":"Owner@123"}'

curl -X POST http://localhost:5000/api/v1/auth/change-password \
  -H "Authorization: Bearer $OWNER_TOKEN" -H "Content-Type: application/json" \
  -d '{"currentPassword":"Owner@123","newPassword":"NewOwnerPass1"}'
```

From there, the owner can `PATCH /api/v1/courses/mine` (fill in the full
profile — see `course.validation.ts` for every field), then
`POST /api/v1/tee-times/bulk` to publish slots, and the `ADMIN` can
`PATCH /api/v1/courses/:id/approve` once the profile is complete.

## 9. Useful scripts

| Command | What it does |
|---|---|
| `npm run dev` | start the dev server with hot reload |
| `npm run build` | compile TypeScript to `dist/` |
| `npm start` | run the compiled `dist/server.js` (production mode, run `build` first) |
| `npm run typecheck` | `tsc --noEmit` — type-check without emitting files |
| `npm run lint` | ESLint over `src/` |

## 10. Where things go

- Uploaded files (when `MEDIA_PROVIDER=LOCAL`, the default) → `./uploads/`,
  served back at `http://localhost:5000/uploads/<filename>`
- Logs → `./logs/error.log` (errors only) and `./logs/combined.log` (everything)

## 11. Troubleshooting

| Symptom | Fix |
|---|---|
| `Transaction numbers are only allowed on a replica set member` | Your MongoDB isn't running with `--replSet` / wasn't initiated — redo §3 |
| App exits immediately printing a list of env var names | One of those is missing/too short in `.env` — see §4's table |
| `CORS` error in the browser console from the website/dashboard | The frontend's actual origin (check the exact port in its terminal output) doesn't match `CLIENT_WEBSITE_URL`/`CLIENT_DASHBOARD_URL` in `.env` exactly |
| `EADDRINUSE` on startup | Something else is already on port 5000 — change `PORT` in `.env` |
| `MongoServerSelectionError` / connection refused | MongoDB isn't running, or `DATABASE_URL` points somewhere wrong |
| 403 "You must change your password before continuing" on a freshly admin-created club-owner account | Expected — see §8, call `/auth/change-password` before any other authenticated route |
