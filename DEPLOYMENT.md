# Deployment — Docker + VPS

Target: a containerized Express app behind nginx on a single VPS, with MongoDB
running as a **single-node replica set** (required — `bookings` and `golfCourses`
use multi-document transactions for overbooking prevention and atomic
course+owner creation; a standalone `mongod` cannot run transactions).

## 1. Server prerequisites

On a fresh Ubuntu 22.04+ VPS (DigitalOcean, Linode, Hetzner, etc.):

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
sudo apt-get install -y docker-compose-plugin
```

Open ports 80/443 (and 22 for SSH) in the provider's firewall/security group.

## 2. Get the code onto the server

```bash
git clone <your-repo-url> tea-it-up-backend
cd tea-it-up-backend
```

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set real values for:
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET` — generate with
  `openssl rand -hex 32` each, do not reuse the example placeholders
- `CLIENT_WEBSITE_URL`, `CLIENT_DASHBOARD_URL` — the real production URLs of
  the two frontends (CORS is locked to exactly these origins)
- Leave `DATABASE_URL` as-is — `docker-compose.yml` overrides it to point at
  the `mongo` container with the replica set already configured

## 4. Build and start

```bash
docker compose up -d --build
```

This starts three containers:
- `mongo` — MongoDB 7, single-node replica set (`rs0`), auto-initiated by the
  healthcheck on first boot
- `app` — the API, built from `Dockerfile`, listening internally on 5000
- `nginx` — reverse proxy on port 80, forwards to `app`

Check everything is healthy:

```bash
docker compose ps
curl http://localhost/health
```

## 5. HTTPS (recommended before going live)

Put [Caddy](https://caddyserver.com/) or `certbot` + the existing nginx
config in front, or swap the `nginx` service for `nginx:alpine` +
`certbot/certbot` with a shared volume for ACME challenges. Given this is a
single nginx server block, the simplest path is replacing the `nginx` image
with `caddy` and a two-line Caddyfile (`api.yourdomain.com { reverse_proxy
app:5000 }`) — Caddy provisions and renews Let's Encrypt certs automatically.

## 6. Backups

MongoDB data lives in the named volume `mongo-data`. Schedule a daily dump:

```bash
docker compose exec mongo mongodump --archive=/data/db/backup-$(date +%F).gz --gzip
```

Copy the resulting archive off the VPS (e.g. to S3/Backblaze) — don't rely on
the same disk the database lives on.

## 7. Updating after a code change

```bash
git pull
docker compose up -d --build app
```

Only the `app` service needs to rebuild; `mongo` and `nginx` are untouched.

## 8. Logs

```bash
docker compose logs -f app
```

Winston also writes `logs/error.log` and `logs/combined.log` inside the `app`
container, persisted via the `logs-data` volume.

## Known operational notes

- **Replica set is mandatory**, not optional — without it, every booking and
  course-creation request will fail with a transactions-not-supported error
  from MongoDB. The `mongo` service's healthcheck handles initiation
  automatically; don't remove `--replSet rs0` from its command.
- **Local-disk media storage** (`uploads-data` volume) lives on this one VPS.
  If you ever move to multiple app replicas behind a load balancer, uploads
  must move to Cloudinary/S3 first (see `media.providers.mediaProvider.factory.ts`)
  — local disk isn't shared across replicas.
- **MongoDB port 27017** is exposed in `docker-compose.yml` for convenience
  during setup/debugging; consider removing that `ports` mapping once you've
  confirmed everything works, so Mongo is reachable only from the `app`
  container on the internal Docker network.
