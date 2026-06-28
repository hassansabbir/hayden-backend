# Tea-It-Up Backend Architecture

Status: **DRAFT — analysis phase, not yet approved for implementation.**

This document covers Steps 1–5 only (frontend analysis, database design, collection
schemas, API architecture, folder structure). No backend code has been written yet —
see "Open questions" at the end before Step 6 (implementation) begins.

---

## 1. Frontend Analysis Summary

Two Next.js apps were analyzed directly from source (not assumed):

- `tea-it-up-website` — player-facing booking site
- `tea-it-up-dashboard` — staff/admin portal

### 1.1 Critical finding: no real auth state exists yet on either frontend

- Website's `useUser.tsx` is `{ isLogin: boolean; login(); logout(); }` — **no user id,
  no email, nothing persisted.** "Logged in" is a pure UI flag today.
- Dashboard's `AuthContext.tsx` (added this session) stores a full mock `AuthUser` in
  `localStorage`, but it's still client-only — no token, no server.
- Neither app's booking forms reference a user id. The website's booking flow
  (`Reserve.tsx`) collects `fullName/phoneNumber/email` directly on the form, and
  `Bookings.tsx` lets anyone "track a booking" by `email + bookingId` — this is a
  **guest-checkout pattern**, not an authenticated-user-only flow. The backend must
  support both: an optional `user` reference and a denormalized contact snapshot on
  every booking.

### 1.2 The two frontends describe the same Course/Club model

The website's course-detail page (`explore-clubs/[id]`) and the dashboard's
`EditClub.tsx` form produce/consume an **identical shape** — `stats`, `sellingPoints`,
`facilities`, `signatureHole`, `gallery`. This is one collection, not two. The simpler
shapes seen on `ExploreClubs.tsx` (listing) and `AllFeatureClub.tsx` (featured grid) and
the dashboard's `AllClubs.tsx` (admin table) are **projections** of this same collection
joined with aggregated `TeeTime`/`Review` data — they don't need separate collections.

### 1.3 Booking/Request is one entity, two names

Dashboard's `RequestItem` (`Requests.tsx`) and website's `Booking` (`MyBookings.tsx`)
are the same record viewed from two sides: `{ name/clubName, date, time, players,
status: Pending|Confirmed|Declined, ref/bookingId }`. The confirm/decline action a
club owner performs in the dashboard is the state transition the player later sees on
`/my-bookings`.

### 1.4 Tee-time shapes differ between the two apps and must be reconciled

- Dashboard `TeaTime.tsx`: `{ date, time, available, total }` (simple counts)
- Dashboard `AddTeaTime.tsx` (creation form): a `date` plus multiple `{ from, to }`
  slot pairs per day — **one form submission creates many slot documents.**
- Website course-detail `teeTimes[]`: `{ time, session, status: "Instant
  Booking"|"Shared Cart Only"|"Member Only", price, available: boolean }`

These reconcile into one `TeeTime` document per bookable slot, with `capacity`/`booked`
counts (dashboard's view), a `bookingType` enum (website's "Instant/Shared/Member
Only"), and a `session` bucket that matches the **exact** filter buckets on
`ExploreClubs.tsx`'s sidebar: `early (6–9am) / midday (9am–2pm) / afternoon (2–5pm) /
twilight (after 5pm)`.

### 1.5 Roles: frontend exercises 2 of the 5 roles you specified

Dashboard's `AuthContext.tsx` only models `"admin" | "club_owner"`. Your instructions
specify 5 roles (Super Admin, Admin, Golf Course Manager, Staff, User). The schema
below supports all 5; only `ADMIN`, `COURSE_MANAGER` (=club_owner), and `USER` (=player)
have a corresponding frontend flow today. `SUPER_ADMIN` and `STAFF` are included for
forward compatibility per your spec, flagged as unexercised by the current UI.

### 1.6 Inferred-but-not-directly-observed pieces (flagged per your "don't assume" instruction)

- **Reviews**: `rating`/`reviewsCount` are displayed as aggregates on the course detail
  page, but no review-*submission* form exists in either frontend. A `Review`
  collection is included because your spec requires the module and the aggregate
  fields have to be sourced from *something* — flagged as inferred, not observed.
- **Memberships**: `Reserve.tsx` shows a `membershipDiscount` line item and
  `MyBookings.tsx` shows "Premium Member" / "Member Since" — no membership
  purchase/upgrade form exists. Modeled minimally.
- **Payments**: confirmation page shows `"Paid via Guest Checkout"` and a total, but no
  card form exists. Modeled as a stub ready for a Stripe-style integration.
- **OTP delivery**: both apps have an identical forgot-password → verify-otp →
  reset-password flow, but it's fully mocked (any 6 digits pass) on both frontends.
  Real OTP persistence/expiry is designed below.

---

## 2. Role & Auth Model

```
Role enum: SUPER_ADMIN | ADMIN | COURSE_MANAGER | STAFF | USER
```

| Role | Maps to frontend | Scope |
|---|---|---|
| `SUPER_ADMIN` | (none yet) | Full platform control, manage Admins |
| `ADMIN` | dashboard `"admin"` | Cross-club visibility (All Clubs, all tee times read-only), approves new clubs |
| `COURSE_MANAGER` | dashboard `"club_owner"` | Owns exactly one `Course`; manages its tee times, requests, profile |
| `STAFF` | (none yet) | Scoped subset of `COURSE_MANAGER` permissions on one course (future use) |
| `USER` | website player | Books tee times, manages own bookings/profile |

Auth: JWT access token (short-lived, ~15 min) + JWT refresh token (long-lived, ~30
days) delivered as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie. Refresh tokens
are stored hashed in `RefreshToken` so they can be individually revoked ("Revoke
Session").

---

## 3. Database Architecture — Collection Overview

| Collection | Purpose |
|---|---|
| `users` | All platform accounts (all 5 roles) |
| `courses` | Golf club/course profiles (unifies website detail + dashboard edit form) |
| `teetimes` | Individual bookable slots belonging to a course |
| `bookings` | Player reservations (= dashboard "Requests") |
| `reviews` | Course ratings/comments (inferred, see §1.6) |
| `memberships` | User membership tier/discount (inferred, see §1.6) |
| `payments` | Payment records per booking (stub, see §1.6) |
| `media` | Uploaded image metadata (Cloudinary refs) for courses/avatars/reviews |
| `notifications` | In-app/email notification log |
| `refreshtokens` | Hashed refresh tokens for session revocation |
| `otptokens` | OTP codes for password reset / email verification |
| `auditlogs` | Sensitive admin actions (club approval, role changes, etc.) |

### Relationship diagram (textual)

```
User (COURSE_MANAGER) 1───1 Course
Course 1───N TeeTime
Course 1───N Review
Course 1───N Media (gallery/hero/signatureHole images)
User (USER) 1───N Booking
TeeTime 1───N Booking (capacity-checked)
Booking 1───1 Payment
User 1───1 Membership
User 1───N RefreshToken
User/email 1───N OtpToken
User 1───N Notification
Any actor 1───N AuditLog
```

---

## 4. Collection Schemas

### 4.1 `User`

**Purpose:** every account on the platform — players and all staff roles.

| Field | Type | Validation | Notes |
|---|---|---|---|
| `fullName` | String | required, 2–80 chars | |
| `email` | String | required, unique, lowercase, email format | login identifier |
| `phone` | String | optional, E.164-ish pattern | website sign-up has it; dashboard accounts may not |
| `passwordHash` | String | required, select:false | bcrypt, 12 salt rounds |
| `role` | String enum | required, default `USER` | `SUPER_ADMIN\|ADMIN\|COURSE_MANAGER\|STAFF\|USER` |
| `course` | ObjectId ref `Course` | required if role is `COURSE_MANAGER`/`STAFF` | one manager per course (1:1) |
| `membershipTier` | String enum | default `STANDARD` | `STANDARD\|PREMIUM\|ELITE` — denormalized for fast reads, source of truth is `Membership` |
| `avatar` | ObjectId ref `Media` | optional | |
| `isEmailVerified` | Boolean | default `false` | |
| `isActive` | Boolean | default `true` | false = suspended account |
| `mustResetPassword` | Boolean | default `false` | set `true` when an `ADMIN` provisions this account (course creation flow); auth guard forces `/reset-password` before any other route until cleared |
| `lastLoginAt` | Date | | |
| `createdBy` / `updatedBy` / `deletedBy` | ObjectId ref `User` | optional | audit trail |
| `isDeleted` | Boolean | default `false` | soft delete |
| `createdAt` / `updatedAt` | Date | auto (timestamps) | |

**Indexes:** unique `email`; `role`; `course` (sparse); text index on `fullName,email`
for admin user search.

**Example document:**
```json
{
  "_id": "665f1...",
  "fullName": "Sarah Owens",
  "email": "owner@royalridges.com",
  "phone": "+15551234567",
  "role": "COURSE_MANAGER",
  "course": "665f2...",
  "membershipTier": "STANDARD",
  "isEmailVerified": true,
  "isActive": true,
  "createdAt": "2026-01-10T08:00:00Z"
}
```

---

### 4.2 `Course`

**Purpose:** a golf club/course profile — unifies the website's detail page and the
dashboard's `EditClub.tsx` form exactly.

| Field | Type | Validation | Notes |
|---|---|---|---|
| `name` | String | required, 2–120 chars | |
| `slug` | String | required, unique, lowercase, kebab-case | for `/explore-clubs/[slug]` style URLs |
| `owner` | ObjectId ref `User` | required, unique | the `COURSE_MANAGER` |
| `location` | String | required | freeform "City, State" today; lat/lng can be added later without a migration since it's additive |
| `status` | String enum | default `PENDING` | `PENDING\|ACTIVE\|SUSPENDED` — matches `AllClubs.tsx`'s Active/Pending |
| `isFeatured` | Boolean | default `false` | drives `/all-feature-club` |
| `rating` | Number | min 0, max 5, default 0 | **aggregate, recomputed from `Review`**, not directly editable |
| `reviewsCount` | Number | min 0, default 0 | aggregate |
| `summary` | String | required, max 300 chars | hero tagline |
| `description` | String | required, max 4000 chars | |
| `heroImage` | ObjectId ref `Media` | required | |
| `stats.yardage` | String | required | e.g. `"7,200"` |
| `stats.par` | Number | required, 27–90 | |
| `stats.slope` | Number | required, 55–155 | |
| `stats.rating` | Number | required | course rating (distinct from review `rating`) |
| `stats.holes` | Number | required, enum `[9, 18]` | |
| `stats.tees` | Number | required, min 1 | |
| `stats.elevation` | String | required | e.g. `"180 ft"` |
| `stats.avgTime` | String | required | e.g. `"4.5h"` |
| `stats.courseType` | String | required | |
| `stats.difficulty` | String | required | |
| `sellingPoints` | Array<`{ title, description }`> | 1–6 items | |
| `facilities` | Array<`{ name, description }`> | 0–12 items | |
| `signatureHole.number` | String | required | |
| `signatureHole.name` | String | required | |
| `signatureHole.par` | Number | required | |
| `signatureHole.yardage` | Number | required | |
| `signatureHole.notes` | String | required | |
| `signatureHole.image` | ObjectId ref `Media` | required | |
| `gallery` | Array<ObjectId ref `Media`> | 0–20 items | |
| `priceRange` | `{ min: Number, max: Number }` | cached, recomputed from `TeeTime` | drives listing-page price display |
| audit + soft delete fields | — | — | same pattern as `User` |

**Indexes:** unique `slug`; `owner` unique; `status`; `isFeatured`; compound
`{status:1, isFeatured:1}`; text index on `name, location, summary` for search.

**Example document:** *(abbreviated — full shape mirrors `EditClub.tsx` exactly)*
```json
{
  "_id": "665f2...",
  "name": "The Royal Ridges Estate",
  "slug": "the-royal-ridges-estate",
  "owner": "665f1...",
  "location": "Orchard Valley, CA",
  "status": "ACTIVE",
  "isFeatured": true,
  "rating": 4.9,
  "reviewsCount": 248,
  "stats": { "yardage": "7,200", "par": 72, "slope": 145, "rating": 74.8, "holes": 18, "tees": 5, "elevation": "180 ft", "avgTime": "4.5h", "courseType": "Parkland / Ridge", "difficulty": "Challenging" },
  "sellingPoints": [{ "title": "Championship Layout", "description": "..." }],
  "signatureHole": { "number": "14", "name": "The Chasm", "par": 4, "yardage": 445, "notes": "..." },
  "priceRange": { "min": 125, "max": 310 }
}
```

---

### 4.3 `TeeTime`

**Purpose:** one bookable slot. Reconciles dashboard's simple count view with the
website's per-slot booking-type/session view (see §1.4).

| Field | Type | Validation | Notes |
|---|---|---|---|
| `course` | ObjectId ref `Course` | required | |
| `date` | Date | required | day only, time-of-day in `startTime` |
| `startTime` | String | required, `HH:mm` 24h | e.g. `"07:00"` |
| `endTime` | String | required, `HH:mm` 24h | from `AddTeaTime.tsx`'s `to` field |
| `session` | String enum | required, derived at write-time from `startTime` | `EARLY_MORNING\|MIDDAY\|AFTERNOON\|TWILIGHT` — matches `ExploreClubs.tsx` filters exactly |
| `bookingType` | String enum | default `INSTANT` | `INSTANT\|SHARED_CART\|MEMBER_ONLY` |
| `price` | Number | required, min 0 | |
| `capacity` | Number | required, min 1, max 4 | total slots (matches `total` in dashboard) |
| `bookedCount` | Number | default 0, min 0, max ≤ `capacity` | incremented atomically on booking confirm |
| `status` | String enum | default `ACTIVE` | `ACTIVE\|CANCELLED` |
| `createdBy` | ObjectId ref `User` | required | the `COURSE_MANAGER` who uploaded it |
| timestamps | — | — | |

**Business rule (overbooking prevention):** `bookedCount` is incremented inside the
same transaction that creates a `Booking`, using a conditional update
(`bookedCount: { $lt: capacity }`) so two concurrent requests can't both succeed past
capacity — no separate locking table needed.

**Indexes:** compound unique `{course:1, date:1, startTime:1}` (no duplicate slots);
`{course:1, date:1}` for calendar queries; `{date:1, session:1}` for the website's
filter+search.

**Example document:**
```json
{
  "_id": "665f3...",
  "course": "665f2...",
  "date": "2026-04-18T00:00:00Z",
  "startTime": "07:00",
  "endTime": "07:10",
  "session": "EARLY_MORNING",
  "bookingType": "INSTANT",
  "price": 185,
  "capacity": 4,
  "bookedCount": 2,
  "status": "ACTIVE"
}
```

---

### 4.4 `Booking`

**Purpose:** a player's reservation request — the single entity behind both the
dashboard's "Requests" page and the website's "My Bookings"/"Track Booking" pages.

| Field | Type | Validation | Notes |
|---|---|---|---|
| `bookingId` | String | required, unique | human-readable, e.g. `MCG-88291-ZX`; used for guest lookup |
| `course` | ObjectId ref `Course` | required | denormalized for fast "Requests" queries without populate |
| `teeTime` | ObjectId ref `TeeTime` | required | |
| `user` | ObjectId ref `User` | **optional** | null for guest bookings — see §1.1 |
| `contact.fullName` | String | required | snapshot, always present even for logged-in users |
| `contact.email` | String | required, email format | |
| `contact.phone` | String | required | |
| `holesPreference` | String enum | required | `"9"\|"18"` |
| `players` | Number | required, 1–4 | must be ≤ remaining capacity on `teeTime` |
| `specialRequests` | String | optional, max 500 chars | |
| `agreedToTerms` | Boolean | required, must be `true` | |
| `status` | String enum | default `PENDING` | `PENDING\|CONFIRMED\|DECLINED\|CANCELLED` |
| `decidedBy` | ObjectId ref `User` | optional | the `COURSE_MANAGER` who confirmed/declined |
| `decidedAt` | Date | optional | |
| `pricing.teeTimePrice` | Number | required | snapshot at booking time |
| `pricing.bookingFee` | Number | required | |
| `pricing.taxes` | Number | required | |
| `pricing.total` | Number | required | |
| timestamps (`createdAt` = "requestedAt") | — | — | |

**Indexes:** unique `bookingId`; compound `{contact.email:1, bookingId:1}` for the
public guest-lookup endpoint; `{course:1, status:1}` for the Requests page tabs;
`{user:1, status:1}` for My Bookings; `{teeTime:1}`.

**Example document:**
```json
{
  "_id": "665f4...",
  "bookingId": "MCG-88291-ZX",
  "course": "665f2...",
  "teeTime": "665f3...",
  "user": null,
  "contact": { "fullName": "Sarah Miller", "email": "sarah.m@example.com", "phone": "+15551234567" },
  "holesPreference": "18",
  "players": 4,
  "status": "PENDING",
  "pricing": { "teeTimePrice": 185, "bookingFee": 9.95, "taxes": 14.8, "total": 209.75 },
  "createdAt": "2026-04-20T10:30:00Z"
}
```

---

### 4.5 `Review` *(inferred — see §1.6)*

| Field | Type | Validation |
|---|---|---|
| `course` | ObjectId ref `Course` | required |
| `user` | ObjectId ref `User` | required (no guest reviews) |
| `booking` | ObjectId ref `Booking` | optional — verifies the reviewer actually played |
| `rating` | Number | required, 1–5 |
| `comment` | String | required, max 1000 chars |
| `images` | Array<ObjectId ref `Media`> | 0–6 |
| `status` | String enum, default `PUBLISHED` | `PUBLISHED\|FLAGGED\|REMOVED` |

**Indexes:** `{course:1, rating:-1}`; unique compound `{course:1, user:1}` (one review
per user per course).

A post-save/remove hook recomputes `Course.rating`/`Course.reviewsCount` via
aggregation (`$avg`, `$count`) — keeps the denormalized course fields in sync.

---

### 4.6 `Membership` *(inferred — see §1.6)*

| Field | Type | Validation |
|---|---|---|
| `user` | ObjectId ref `User` | required, unique |
| `tier` | String enum | `STANDARD\|PREMIUM\|ELITE` |
| `discountPercent` | Number | 0–100 |
| `startDate` | Date | required |
| `expiresAt` | Date | optional (null = non-expiring) |
| `status` | String enum | `ACTIVE\|EXPIRED\|CANCELLED` |

`User.membershipTier` is denormalized from this for cheap reads; this collection is
the source of truth and history.

---

### 4.7 `Payment` *(stub — see §1.6)*

| Field | Type | Validation |
|---|---|---|
| `booking` | ObjectId ref `Booking` | required, unique |
| `amount` | Number | required |
| `currency` | String | default `"USD"` |
| `method` | String enum | `GUEST_CHECKOUT\|CARD\|MEMBERSHIP_CREDIT` |
| `provider` | String | e.g. `"stripe"` — placeholder |
| `transactionId` | String | unique, sparse |
| `status` | String enum | `PENDING\|PAID\|REFUNDED\|FAILED` |
| `paidAt` | Date | optional |

---

### 4.8 `Media`

**Purpose:** metadata for every uploaded image (course hero/gallery/signature hole,
user avatars, review images) — backs the `ImageUpload` component used throughout both
apps' forms.

**Storage:** no Cloudinary credentials available yet (see §8.4). The module is built
against a `MediaProvider` interface (`upload(file) / delete(publicId) /
replace(publicId, file)`); the default implementation writes to local disk under
`/uploads` and serves via a static Express route. Switching to Cloudinary later means
adding a `CloudinaryMediaProvider` class — no changes to the schema, service, or
controller layer.

| Field | Type | Validation |
|---|---|---|
| `url` | String | required (local `/uploads/...` path today; Cloudinary secure URL after provider swap) |
| `publicId` | String | required (local filename today; Cloudinary public id after swap) — used for delete/replace regardless of provider |
| `provider` | String enum | default `LOCAL` | `LOCAL\|CLOUDINARY` — lets `Media` rows from before/after a future provider swap coexist |
| `type` | String enum | `COURSE_HERO\|COURSE_GALLERY\|SIGNATURE_HOLE\|USER_AVATAR\|REVIEW_IMAGE` |
| `relatedTo` | ObjectId | refPath-based, points to `Course`/`User`/`Review` |
| `relatedModel` | String enum | `Course\|User\|Review` (refPath target) |
| `mimeType` | String | required, validated against allow-list |
| `sizeBytes` | Number | required, max enforced per type (e.g. 5MB) |
| `width` / `height` | Number | optional |
| `uploadedBy` | ObjectId ref `User` | required |

**Indexes:** `{relatedModel:1, relatedTo:1}`.

---

### 4.9 `Notification`

| Field | Type | Validation |
|---|---|---|
| `user` | ObjectId ref `User` | required |
| `type` | String enum | `BOOKING_CONFIRMED\|BOOKING_DECLINED\|CLUB_APPROVED\|PASSWORD_RESET\|OTP_ISSUED` |
| `title` | String | required |
| `message` | String | required |
| `channel` | String enum | `IN_APP\|EMAIL` |
| `isRead` | Boolean | default `false` |

**Indexes:** `{user:1, isRead:1, createdAt:-1}`.

---

### 4.10 `RefreshToken`

| Field | Type | Validation |
|---|---|---|
| `user` | ObjectId ref `User` | required |
| `tokenHash` | String | required, unique (SHA-256 of the actual token) |
| `userAgent` | String | optional |
| `ip` | String | optional |
| `expiresAt` | Date | required |
| `revoked` | Boolean | default `false` |

**Indexes:** unique `tokenHash`; TTL index on `expiresAt` (Mongo auto-deletes expired
docs); `{user:1, revoked:1}` to power "active sessions" / "revoke session" UI.

---

### 4.11 `OtpToken`

| Field | Type | Validation |
|---|---|---|
| `email` | String | required, lowercase |
| `otpHash` | String | required (bcrypt of the 6-digit code) |
| `purpose` | String enum | `PASSWORD_RESET\|EMAIL_VERIFICATION` |
| `attempts` | Number | default 0, max 5 |
| `expiresAt` | Date | required (10 min from issue) |
| `consumed` | Boolean | default `false` |

**Indexes:** `{email:1, purpose:1}`; TTL index on `expiresAt`.

---

### 4.12 `AuditLog`

| Field | Type | Validation |
|---|---|---|
| `actor` | ObjectId ref `User` | required |
| `action` | String | e.g. `"COURSE_APPROVED"`, `"BOOKING_DECLINED"`, `"ROLE_CHANGED"` |
| `targetModel` | String | e.g. `"Course"` |
| `targetId` | ObjectId | required |
| `metadata` | Mixed | freeform diff/context |
| `createdAt` | Date | auto |

**Indexes:** `{targetModel:1, targetId:1}`; `{actor:1, createdAt:-1}`.

---

## 5. API Architecture

All responses use the success/error envelope you specified. All list endpoints accept
`page, limit, sort, search` query params via a shared pagination utility and return the
`{page, limit, total, totalPages}` meta block.

### 5.1 `auth` module
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/auth/register` | public | role defaults to `USER`; website sign-up |
| POST | `/api/v1/auth/login` | public | sets refresh-token cookie, returns access token |
| POST | `/api/v1/auth/logout` | access token | revokes the refresh token |
| POST | `/api/v1/auth/refresh-token` | refresh cookie | rotates refresh token |
| POST | `/api/v1/auth/forgot-password` | public | issues `OtpToken`, purpose `PASSWORD_RESET` |
| POST | `/api/v1/auth/verify-otp` | public | validates code, returns a short-lived reset ticket |
| POST | `/api/v1/auth/reset-password` | reset ticket | consumes `OtpToken` |
| POST | `/api/v1/auth/change-password` | access token | for the dashboard profile page |
| GET | `/api/v1/auth/sessions` | access token | list active `RefreshToken`s |
| DELETE | `/api/v1/auth/sessions/:id` | access token | revoke one session |

### 5.2 `users` module
| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/users/me` | any authenticated role |
| PATCH | `/api/v1/users/me` | any authenticated role — fullName/phone/avatar |
| GET | `/api/v1/users` | `SUPER_ADMIN, ADMIN` — admin user list |
| PATCH | `/api/v1/users/:id/status` | `SUPER_ADMIN, ADMIN` — suspend/reactivate |

### 5.3 `golfCourses` module
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/courses` | public | listing page; filters: `time, players, priceMin, priceMax, search` |
| GET | `/api/v1/courses/featured` | public | `isFeatured: true` |
| GET | `/api/v1/courses/:slug` | public | full detail incl. embedded teeTimes for the selected date |
| POST | `/api/v1/courses` | `ADMIN, SUPER_ADMIN` | atomically creates `User(COURSE_MANAGER)` + `Course(status: PENDING)` — backs `AllClubs.tsx`'s create-club modal |
| GET | `/api/v1/courses/admin/all` | `ADMIN, SUPER_ADMIN` | full table incl. owner email, teeTimeCount — backs `AllClubs.tsx` |
| PATCH | `/api/v1/courses/:id/approve` | `ADMIN, SUPER_ADMIN` | status `PENDING → ACTIVE`; writes `AuditLog` |
| GET | `/api/v1/courses/mine` | `COURSE_MANAGER` | the manager's own course |
| PATCH | `/api/v1/courses/mine` | `COURSE_MANAGER` | full edit form — backs `EditClub.tsx` |

### 5.4 `teeTimes` module
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/tee-times` | `COURSE_MANAGER` (own course) or `ADMIN` (all courses, read-only) | role branch matches `TeaTime.tsx` exactly |
| POST | `/api/v1/tee-times/bulk` | `COURSE_MANAGER` | one `date` + multiple `{from,to}` pairs → N documents, matches `AddTeaTime.tsx` |
| PATCH | `/api/v1/tee-times/:id` | `COURSE_MANAGER` (own course only) | |
| DELETE | `/api/v1/tee-times/:id` | `COURSE_MANAGER` (own course only) | blocked if `bookedCount > 0` |

### 5.5 `bookings` module
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/v1/bookings` | public (guest) or `USER` | the `Reserve.tsx` form; capacity-checked transaction |
| GET | `/api/v1/bookings/lookup` | public | query `email + bookingId` — backs `Bookings.tsx` track flow |
| GET | `/api/v1/bookings/mine` | `USER` | backs `MyBookings.tsx`, tabs by status |
| GET | `/api/v1/bookings` | `COURSE_MANAGER` (own course) or `ADMIN` (all) | backs `Requests.tsx`, filter by status tab |
| PATCH | `/api/v1/bookings/:id/confirm` | `COURSE_MANAGER` only | matches the role-gate already built in `Requests.tsx` |
| PATCH | `/api/v1/bookings/:id/decline` | `COURSE_MANAGER` only | |
| PATCH | `/api/v1/bookings/:id/cancel` | `USER` (own booking) | |

### 5.6 `reviews` module
| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/courses/:id/reviews` | public |
| POST | `/api/v1/courses/:id/reviews` | `USER`, must have a `CONFIRMED` past booking at that course |

### 5.7 `memberships` module
| Method | Path | Auth |
|---|---|---|
| GET | `/api/v1/memberships/mine` | `USER` |
| PATCH | `/api/v1/memberships/mine` | `USER` — upgrade/downgrade tier (payment stubbed) |

### 5.8 `payments` module
| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/payments/:bookingId` | public/`USER` | stub — records a `GUEST_CHECKOUT` payment today, swappable for Stripe later |

### 5.9 `media` module
| Method | Path | Auth |
|---|---|---|
| POST | `/api/v1/media/upload` | authenticated | Multer → Cloudinary, returns `Media` doc |
| DELETE | `/api/v1/media/:id` | owner of the related entity or `ADMIN` |

### 5.10 `dashboard` module (analytics/aggregation)
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/v1/dashboard/stats` | `COURSE_MANAGER`/`ADMIN` | backs `GeneralState.tsx` — total/pending/confirmed/declined counts |
| GET | `/api/v1/dashboard/requests-overview` | same | backs `RequestOverview.tsx` — 7-day trend, `$group` by day |
| GET | `/api/v1/dashboard/booking-status` | same | backs `BookingStatusChart.tsx` |
| GET | `/api/v1/dashboard/tee-time-utilization` | same | backs `TeeTimeUtilization.tsx` — booked vs available per day |

---

## 6. Folder Structure

Your template, filled in with the modules actually identified above:

```
src/
├── app/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── golfCourses/
│   │   ├── teeTimes/
│   │   ├── bookings/
│   │   ├── reviews/
│   │   ├── memberships/
│   │   ├── payments/
│   │   ├── media/
│   │   ├── notifications/
│   │   ├── dashboard/
│   │   └── auditLogs/
│   │
│   ├── middlewares/        # auth, requireRole, validateRequest, rateLimiter, error handlers
│   ├── errors/             # AppError, handleZodError, handleCastError, handleDuplicateKey, handleMongooseValidation
│   ├── utils/              # sendResponse, catchAsync, paginationHelper, jwtHelpers, otpHelpers, slugify
│   ├── routes/             # route aggregator (mounts every module's .route.ts)
│   └── config/             # env validation (zod), db connection, cloudinary config, logger config
│
├── server.ts                # http server bootstrap, graceful shutdown
└── app.ts                   # express app, global middleware wiring
```

Each module follows your exact per-module file convention
(`*.interface.ts / *.model.ts / *.validation.ts / *.service.ts / *.controller.ts /
*.route.ts / *.constant.ts`).

---

## 7. Key Business Rules

1. **No overbooking**: `Booking` creation and `TeeTime.bookedCount` increment happen in
   one Mongo transaction with a `bookedCount: {$lt: capacity}` guard.
2. **Guest bookings allowed**: `Booking.user` is nullable; `Booking.contact` is always
   populated regardless, since neither frontend currently requires login to book.
3. **Role gating mirrors what's already built in the dashboard**: `COURSE_MANAGER`
   confirms/declines only their own course's bookings and edits only their own course;
   `ADMIN` is read-only across all courses except club approval; only `ADMIN`/
   `SUPER_ADMIN` create new clubs (which provisions the owner account too).
4. **One course per manager**: enforced via unique index on `Course.owner`.
5. **OTP**: 6-digit code, bcrypt-hashed at rest, 10-minute expiry, max 5 verify
   attempts, single-use (`consumed` flag).
6. **Soft delete + audit** on `User` and `Course` (the only two collections users
   directly author/own); hard collections like `RefreshToken`/`OtpToken` use TTL
   expiry instead since they're not meant to be retained.
7. **Forced password reset for admin-provisioned accounts**: when `ADMIN` creates a
   club via `POST /courses`, the new `COURSE_MANAGER` account is created with
   `mustResetPassword: true`. The login response/middleware checks this flag and
   blocks every route except `/auth/reset-password` until cleared.

---

## 8. Resolved Decisions

1. **Reviews, Memberships, Payments**: build full modules now (model + service +
   controller + routes), not stubs — avoids a later schema migration once those
   frontend flows exist.
2. **`SUPER_ADMIN` / `STAFF` roles**: schema support only for now. The `Role` enum
   includes both, but no routes/middleware are gated on them yet — only `ADMIN`,
   `COURSE_MANAGER`, `USER` get real permission logic, since those are the only roles
   with a frontend today. Adding the other two later is additive.
3. **Admin-provisioned club-owner accounts**: force a password reset on first login.
   `User` gets a `mustResetPassword: Boolean` flag, set `true` when an `ADMIN` creates
   the account via `POST /courses`; the dashboard's auth guard checks this flag and
   redirects to `/reset-password` before allowing access to anything else.
4. **Media storage**: no Cloudinary credentials yet. Build `media` module behind a
   small `MediaProvider` interface (`upload/delete/replace`) with a local-disk
   implementation as the default (files under `/uploads`, metadata still in the
   `Media` collection). Swapping in Cloudinary later is a new provider class, not a
   rewrite.
5. **Deployment target**: Docker + VPS (containerized Express app behind nginx,
   MongoDB via Atlas or self-hosted). Step 7 instructions will target this.

## 9. Implementation Notes (post-build)

The backend in this repo is fully implemented per the design above. A few
pragmatic substitutions were made during the build that the spec didn't
pin down:

- **`bcryptjs` instead of `bcrypt`**: pure-JS, no native build toolchain
  needed — avoids native-module compile failures on a Windows dev machine
  without Visual Studio build tools. Identical API, same hashing algorithm.
- **`xss` instead of `xss-clean`**: `xss-clean` is unmaintained and has open
  advisories. `src/app/middlewares/xssSanitize.ts` recursively applies the
  actively-maintained `xss` package to `body`/`params`/`query`, which is
  what `xss-clean` did internally anyway.
- **No `@app/*` path aliases**: kept all imports relative. Path aliases need
  `tsconfig-paths` (or a bundler) to resolve at runtime under `ts-node-dev`;
  skipped that extra moving part for a project this size.
- **MongoDB replica set is required**, not optional — `bookings.createBooking`
  and `golfCourses.createCourseWithOwner` both use multi-document
  transactions (atomic capacity-checked booking, atomic owner+course
  creation). A standalone `mongod` does not support transactions. See
  `DEPLOYMENT.md` — the Docker Compose `mongo` service runs as a single-node
  replica set (`rs0`) specifically for this reason.
- **Frontend gap surfaced during implementation**: `AddTeaTime.tsx`'s bulk
  tee-time form (date + multiple `{from, to}` slots) doesn't currently
  collect `price`, `capacity`, or `bookingType` per slot, but a real bookable
  slot can't have an undefined price. `POST /tee-times/bulk` requires these
  fields — the dashboard form will need a small follow-up update to collect
  them before that endpoint can be wired up end-to-end.
- **Course completeness gating**: `Course.heroImage`/`stats`/`signatureHole`/
  `summary`/`description` are optional at the schema level (a freshly
  admin-created club has none of them yet) but required before `ADMIN` can
  flip status from `PENDING` to `ACTIVE` — enforced in
  `course.service.ts#approveCourse`, not via Mongoose `required: true`.
