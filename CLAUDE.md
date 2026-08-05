# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Full-stack travel platform (MakeMyTrip clone) supporting flights, hotels, buses, cabs, trains, and more. Built with React 18 + Vite (frontend) and Node.js + Express + **Firebase/Firestore as the only database and source of truth** (backend). Includes complete user booking system and admin panel for content management.

**IMPORTANT — Database policy:** Firestore is the **only** database. There is no MongoDB, no Mongoose, no Prisma and no Postgres anywhere in this repository — the ORM layer was fully removed, including `src/models/`, `src/config/db.js`, `src/config/prismaClient.js` and every Prisma-backed seed script. Do not reintroduce any of them. Use the `firebase*Controller.js` controllers; admin and vendor paths use the Firestore CRUD factories in `src/controllers/factories/`.

## Monorepo Structure
```
make-my-trip-practical/
├── makemytrip-frontend/    # React 18 + Vite app — http://localhost:5173
├── makemytrip-backend/     # Express API server — http://localhost:5000
└── files/                  # Reference docs (design specs, architecture)
```

## Dev Commands

### Frontend
```bash
cd makemytrip-frontend

npm run dev       # Start dev server (Vite)
npm run build     # Production build (dist/)
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

### Backend
```bash
cd makemytrip-backend

npm run dev                  # Start with --watch (auto-reload on changes)
npm run start                # Start normally (production)
npm run test                 # Regression + auth + audit suites (real Firestore)
npm run test:mocked          # Offline suites (module-mocked; no datastore, no network)
npm run verify:payment       # Real Razorpay test-mode order + signed webhook -> booking
                             #   add -- --local-webhook-secret to arm the webhook stages
npm run admin:create         # Provision the first admin (add --super for SUPER_ADMIN)

# Seeding — every one of these writes to Firestore
npm run seed                 # flights + hotels
npm run seed:hotels          # hotels only
npm run seed:trains          # trains only
npm run seed:buses           # buses only
npm run seed:cabs            # outstation cab routes
npm run seed:cms             # CMS page content
npm run seed:email-templates # publish default email templates

# Maintenance
npm run migrate:emails       # canonicalise user document ids (dry-run by default)
npm run purge:sessions       # delete expired/revoked sessions (dry-run by default)

# Dated inventory — hotels/buses/trains sell per travel date, not from a global
# counter. All three are dry-run by default; add -- --apply to write.
npm run migrate:dated-availability   # write dailyInventory + datedAvailability flag
npm run verify:dated-availability    # read-only: reconcile bookings vs availability
npm run rollback:dated-availability  # clear the flag; falls back to legacy counters
```

## Frontend Stack
- **React 18** + **Vite** (ESM, fast HMR)
- **React Router DOM v7** — SPA; all 75 page components are code-split via `React.lazy` behind a `<Suspense>` boundary in `App.jsx`
- **Redux Toolkit** — store: `search`, `auth` slices
- **TanStack React Query** — server state management, caching
- **Axios** — HTTP client with auth interceptors (`src/services/api.js`)
- **GSAP** + **Swiper** — animations and carousel components
- **html2canvas + jsPDF** — PDF ticket generation

### Authentication Pattern
- **User Auth**: `src/context/AuthContext.jsx` wraps app, stores JWT in localStorage
- **Admin Auth**: `src/context/AdminContext.jsx` for admin users (separate login flow)
- Email/password + phone/OTP login paths supported
- Auto-restore session on page load via profile endpoint

### Key Frontend Directories
| Path | Purpose |
|------|---------|
| `src/pages/` | Main page components (HomePage, search results, booking flows, admin pages) |
| `src/components/` | Reusable UI components (Header, Footer, cards, forms) |
| `src/context/` | AuthContext, AdminContext — global state |
| `src/services/` | API wrappers: authService, flightService, hotelService, adminService |
| `src/store/` | Redux store configuration |
| `src/config/` | Axios base config |

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/App.jsx` | Router setup, wraps with AuthProvider, Header, Footer |
| `src/pages/HomePage.jsx` | Landing page with hero search and below-fold sections |
| `src/pages/SearchResultsPage.jsx` | Flight search results with filters |
| `src/pages/BookingPage.jsx` | Flight traveller details + price summary |
| `src/pages/HotelListingPage.jsx` | Hotel search & filter |
| `src/pages/HotelDetailsPage.jsx` | Hotel detail view, date/room picker |
| `src/pages/AdminDashboard.jsx` | Admin home — stats, revenue, bookings |
| `src/pages/AdminFlights.jsx` | Flight CRUD (create/list/edit/delete) |
| `src/pages/AdminHotels.jsx` | Hotel CRUD |
| `src/context/AuthContext.jsx` | User auth state (login, register, OTP verify, logout) |
| `src/context/AdminContext.jsx` | Admin auth state (separate from user auth) |
| `src/services/api.js` | Axios instance with interceptors (JWT injection, error handling) |
| `src/services/authService.js` | User login/register/OTP endpoints |
| `src/services/adminService.js` | Admin CRUD endpoints |
| `src/services/flightService.js` | Flight search & details |
| `src/services/hotelService.js` | Hotel search & details |

### Frontend .env
File: `makemytrip-frontend/.env.local`
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Backend Stack
- **Node.js ESM** (always use `import/export`, never `require()`)
- **Express.js** — REST API with versioned routes (`/api/v1/*`)
- **Firebase Admin SDK + Firestore** — the only database: users, bookings, flights, hotels, buses, trains, cabs, OTPs
- Firestore is configured with `ignoreUndefinedProperties: true`
- **Indexes are declared, not avoided.** `where + orderBy` on different fields needs a composite index — add it to `firestore.indexes.json` and let CI deploy it, rather than sorting in memory. Multiple *equality* filters need no composite; Firestore merges single-field indexes.
- **Dates must be one type per field.** Firestore orders by type before value and a range filter never matches across types, so a field holding both ISO strings and Timestamps cannot be indexed or sorted. Write `FieldValue.serverTimestamp()`, read through `src/utils/time.js` (`toDate`/`toMillis`/`byNewest`), and run `npm run migrate:timestamps` after introducing a new date field.
- **JWT (`jsonwebtoken`)** — token-based auth (Bearer scheme)
- **bcryptjs** — password hashing
- **Nodemailer** — email notifications (booking confirmations)
- **node-cache** — in-memory caching for search results

### Authentication Middleware
- **User Auth**: `src/middleware/auth.js` — validates Bearer tokens, attaches `req.user`
- **Admin Auth**: `src/middleware/adminAuth.js` — validates admin tokens + role check
- Both required for protected endpoints

### API Routes Structure
All routes support dual versioning: `/api/*` and `/api/v1/*` (both work)

#### Authentication
```
POST   /api/v1/auth/register          — User registration
POST   /api/v1/auth/login             — User login
POST   /api/v1/auth/verify-otp        — OTP verification for mobile auth
POST   /api/v1/auth/logout            — Logout
GET    /api/v1/auth/profile           — Get current user (requires auth)
```

#### User Data
```
GET    /api/v1/user/profile           — User details (auth required)
PUT    /api/v1/user/profile           — Update profile (auth required)
GET    /api/v1/user/bookings          — My bookings (auth required)
```

#### Flights
```
GET    /api/v1/flights                — Search flights (filters: from, to, date, passengers, minPrice, maxPrice, airline, departureWindow)
GET    /api/v1/flights/:id            — Flight details
POST   /api/v1/bookings/flights       — Create flight booking (auth required)
```

#### Hotels
```
GET    /api/v1/hotels                 — Search hotels (filters: city, checkIn, checkOut, guests, rooms, priceRange)
GET    /api/v1/hotels/:id             — Hotel details
POST   /api/v1/bookings/hotels        — Create hotel booking (auth required)
```

#### Autocomplete
```
GET    /api/v1/autocomplete/cities    — City suggestions for flight/hotel search
GET    /api/v1/autocomplete/airlines  — Airline list
```

#### Unified Search
```
GET    /api/v1/search?q=query         — Cross-service search (flights, hotels, buses, etc.)
```

#### Error reporting
```
POST   /api/v1/client-errors          — Frontend ErrorBoundary crash sink (public, rate limited)
```

Unhandled server errors and browser crashes are grouped by fingerprint into the
`errorReports` collection — one document per distinct failure with an occurrence
count, not one per occurrence. `src/services/errorReporter.js` redacts JWTs,
emails, phone numbers, card numbers and gateway keys before writing, never
stores a request body, and never throws. Repeat writes for the same fingerprint
are throttled (`ERROR_REPORT_THROTTLE_SECONDS`, default 60) so a hot error loop
cannot exhaust the Firestore daily quota. `onErrorReported()` is the seam for
forwarding to Sentry later without touching a call site.

#### Bookings
```
GET    /api/v1/bookings               — All bookings (admin, auth required)
GET    /api/v1/bookings/:id           — Booking details
POST   /api/v1/bookings/flights       — Create flight booking (auth required)
POST   /api/v1/bookings/hotels        — Create hotel booking (auth required)
```

#### Payments
```
POST   /api/v1/payment/quote          — Authoritative price + signed quoteToken (auth required)
POST   /api/v1/payment/create-order   — Razorpay order; takes { quoteToken }, NOT an amount (auth required)
POST   /api/v1/payment/verify         — Verify gateway callback; creates the booking (auth required)
POST   /api/v1/payment/webhook        — Razorpay webhook; HMAC-authenticated, NOT session-authenticated
```

`/payment/webhook` is the only reliable source of payment truth — `/payment/verify`
runs only if the customer's browser comes back. It is mounted with `express.raw`
**ahead of** `express.json` in `src/index.js` (a re-serialised body does not
reproduce the bytes Razorpay signed), declared before the router-level
`authenticate`, and idempotent through the `pay_{paymentId}` document key.

#### Admin (all require `authenticateAdmin` + `adminOnly`; `/register` additionally requires SUPER_ADMIN)
```
# Auth
POST   /api/v1/admin/register         — Create an admin (SUPER_ADMIN only; bootstrap the first one with `npm run admin:create`)
POST   /api/v1/admin/login            — Admin login
GET    /api/v1/admin/profile          — Admin profile
PUT    /api/v1/admin/change-password  — Change admin password

# Dashboard
GET    /api/v1/admin/dashboard/stats          — Key metrics (bookings, revenue, users)
GET    /api/v1/admin/dashboard/revenue        — Revenue by date/service
GET    /api/v1/admin/dashboard/recent-bookings — Recent bookings list
GET    /api/v1/admin/dashboard/availability  — Seat/room availability

# Flights (15 endpoints)
POST   /api/v1/admin/flights                  — Create
GET    /api/v1/admin/flights                  — List all
GET    /api/v1/admin/flights/:id              — Get one
PUT    /api/v1/admin/flights/:id              — Update
DELETE /api/v1/admin/flights/:id              — Delete
PATCH  /api/v1/admin/flights/:id/toggle       — Toggle active/inactive status

# Hotels (17 endpoints)
POST   /api/v1/admin/hotels                   — Create
GET    /api/v1/admin/hotels                   — List all
GET    /api/v1/admin/hotels/:id               — Get one
PUT    /api/v1/admin/hotels/:id               — Update
DELETE /api/v1/admin/hotels/:id               — Delete
PATCH  /api/v1/admin/hotels/:id/toggle        — Toggle status
PUT    /api/v1/admin/hotels/:id/images        — Update hotel images
GET    /api/v1/admin/hotels/:id/images        — Get hotel images

# Buses (6 endpoints) — same pattern as flights
# Cabs (6 endpoints) — same pattern as flights
```

### Key Backend Files
| File | Purpose |
|------|---------|
| `src/index.js` | Express app setup, route registration, CORS, error handlers |
| `src/config/firebase.js` | Firebase Admin SDK initialization |
| `src/middleware/auth.js` | JWT verification for users (Bearer token) |
| `src/middleware/adminAuth.js` | JWT + role verification for admins |
| `src/controllers/authController.js` | User register/login/OTP/logout |
| `src/controllers/adminAuthController.js` | Admin register/login/password change |
| `src/controllers/flightController.js` | Flight search/filter with availability checks |
| `src/controllers/flightAdminController.js` | Flight CRUD operations |
| `src/controllers/hotelController.js` | Hotel search/filter/availability |
| `src/controllers/hotelAdminController.js` | Hotel CRUD + image management |
| `src/controllers/bookingController.js` | Create/retrieve bookings with atomic availability decrement |
| `src/controllers/busAdminController.js` | Bus CRUD operations |
| `src/controllers/cabAdminController.js` | Cab CRUD operations |
| `src/controllers/paymentController.js` | Payment gateway integration |
| `src/controllers/dashboardController.js` | Admin dashboard stats/revenue queries |
| `src/controllers/autocompleteController.js` | Search suggestions |
| `src/controllers/userController.js` | User profile management |
| `scripts/seed.js` | Seed Firestore with dummy data |
| `scripts/seedFlights.js` | Seed flights only |

### Backend .env
File: `makemytrip-backend/.env`

> **Never commit this file, or any `makemytrip-backend/.env.*`.** They are
> gitignored. `.env.production` was previously committed to a public repo and
> leaked live Supabase, SMTP, Razorpay and RapidAPI credentials plus the
> `JWT_SECRET`; those must stay rotated and out of git history.
>
> `JWT_SECRET` also signs price quotes, so changing it invalidates in-flight
> quotes (customers simply re-quote). The server refuses to boot without it.

```
PORT=5000
NODE_ENV=development

# Firebase — the only database. Either provide serviceAccountKey.json in the
# backend root, or set these three vars.
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=your-email@appspot.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# JWT
JWT_SECRET=your-secret-key-change-in-production
ACCESS_TOKEN_TTL=1h
REFRESH_TOKEN_TTL_DAYS=30

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional for booking confirmations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway (Razorpay/Stripe)
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
# Webhook signing secret — NOT the API key secret. Dashboard → Settings →
# Webhooks. Startup aborts in production without it.
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
```

### Firebase Credentials (Optional)
Firestore is the only database. To connect it:
- Place `serviceAccountKey.json` in `makemytrip-backend/` root (listed in .gitignore)
- OR set env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Firestore collections: `flights`, `hotels`, `bookings` (for high-velocity data)

## Data Models

### Firestore Collections
- **users** — { email, phone, name, passwordHash, profile, createdAt }
- **admins** — { email, passwordHash, role, permissions, lastLogin }
- **bookings** — { bookingId, userId, bookingType (flight/hotel), details, totalPrice, status }
- **flights** — { from, to, departureTime, arrivalTime, durationMinutes, price, seatsAvailable, airlineName }
- **hotels** — { name, city, address, price, roomsAvailable, rating, amenities, images }
- **buses** — { from, to, departureTime, arrivalTime, price, seatsAvailable }
- **cabs** — { from, to, price, capacity, type }

### Availability Tracking
- Flight/Hotel bookings reserve inventory inside the **same Firestore transaction** that writes the booking (`bookingService.reserveAvailabilityInTx`), so there is never a seat without a booking or a booking without a seat
- Check availability **before** creating booking (atomic read-modify-write in controller)
- No overbooking possible — race condition safe

## Design Conventions
- **Homepage**: Hero section owns navbar (logo + nav + search). Header.jsx returns null on `/`
- **Images**: Unsplash CDN with responsive sizing: `https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w={w}&h={h}&q=80`
- **Responsive breakpoints**: 900px (tablet), 600px (mobile)
- **Colors**: Primary blue `#003580`, accent red `#e63946`, CTA blue `#1a73e8`
- **CSS variables**: `--ac` (airline brand color), `--hc` (hotel brand color) for dynamic theming
- **Pricing**: server-side only, in `pricingService.js`. The frontend renders the quote it is given and never computes a total.
- **Date validation**: Checkout > checkin, minimum 1 night, maximum 90 nights
- **Notifications**: Use custom toast system (bottom-right, auto-dismiss) instead of browser alerts

## Coding Rules
- Backend is **ESM only** — import/export everywhere, never require()
- No comments unless WHY is non-obvious (avoid describing WHAT — code should be self-evident)
- No premature abstractions — three similar lines is better than a generic helper
- Validate only at boundaries: user input, external API responses, form submissions
- Price calculations live ONLY in the backend `pricingService.js`
- Availability checks must happen atomically in booking controller
- Never spread a raw request body into a Firestore document — whitelist the fields the client may set

## Key Architecture Patterns

### Pricing — server-side only (`makemytrip-backend/src/services/pricingService.js`)

**The client never decides what anything costs.** The backend prices every trip
from stored inventory and returns a short-lived signed `quoteToken`:

```
POST /api/v1/payment/quote   { type, itemId, quantity, nights, distance }
  -> { baseFare, taxes, gst, convenience, totalAmount, policy, quoteToken }
POST /api/v1/payment/create-order  { quoteToken }   // amount re-derived, never read from the body
```

Rules:
- Tax slabs and convenience fees live in `TAX_POLICY` in `pricingService.js`. Change them there — nowhere else.
- Cab fares are `price` (base) + `perKmRate × distance`. `cabAdminController` normalises `baseFare` onto `price`.
- The frontend displays the quote's breakdown verbatim (`src/services/checkout.js`); it must never compute a total.
- `create-order` rejects a bare `amount` with `QUOTE_REQUIRED`. A stale quote whose price moved is rejected with `QUOTE_STALE`.

### Closed verticals (`src/config/verticals.js`)

**Cabs are not sellable.** `RESOURCE_COLLECTIONS` in `bookingService.js` covers
flight, hotel, bus and train — not cab — so a cab booking reserves nothing and
sells without limit. `quoteTrip` refuses any type in `UNSELLABLE_TYPES` with
`503 VERTICAL_UNAVAILABLE`, which is the chokepoint: no quote → no signed token
→ `create-order` refuses → no captured payment → no booking. Existing cab
bookings stay readable and cancellable. Reopen by giving cabs a daily capacity
model per route and class, then clearing the env var.

The seven verticals with no backend at all (Cruise, Forex, Visa, Insurance,
Tours, Homestays, Holidays) render a storefront and carry a `<ComingSoon>`
banner. `tests/search.test.mjs` pins that they still do.

### Booking creation — one path, payment required (`src/services/bookingService.js`)

`createBookingForPayment()` is the **only** function that writes a booking document.
`POST /payment/verify`, `POST /payment/webhook` and `POST /bookings/*` all go through it.

- A booking requires a **captured, caller-owned** gateway payment; `totalAmount` comes from the gateway, never the request.
- **The booking must match the quote it was paid for.** The gateway fixes the *price*; nothing fixed the *item*, so a trip could be priced as the cheapest bus seat and booked as a long-haul flight. Every caller passes the `quote` recorded on the payment document at create-order time, and `assertMatchesQuote` rejects a mismatched type, itemId, seat count or night count with `QUOTE_MISMATCH` **before** anything is written. Quantity and nights are capped, not pinned — booking less than was paid for is a refund question, and flight payloads legitimately reserve fewer seats than they price (infants travel on a lap).
- Client payloads are **whitelisted** — `SERVER_OWNED_FIELDS` (userId, bookingId, status, paymentStatus, …) are stripped. Never spread the raw request body into a Firestore document.
- Booking docs are keyed `pay_{paymentId}`, so retries and double-clicks are idempotent.
- Cancellation calls `releaseAvailability()` to return seats/rooms to the pool.

### Availability Tracking
1. Fetch resource and check `seatsAvailable` / `roomsAvailable`
2. If insufficient, reject with 400 error
3. If sufficient, atomically decrement in same transaction as booking creation
4. Reservation and booking commit or fail together — see `reserveAvailabilityInTx`
5. Cancellation calls `releaseAvailability()` exactly once, guarded by a transaction so concurrent cancels cannot double-release

### Error Handling
- Validate input at API endpoint level (check dates, guest counts, email format)
- Return 400 for validation failures, 403 for auth, 404 for not found, 500 for server errors
- Frontend: catch errors, display toast notifications (not browser alerts)
- Provide user-friendly error messages (not technical stack traces)

### Authentication Flow — sessions are revocable (`src/services/tokenService.js`)

1. **User**: Login → short-lived access token + rotating refresh token → localStorage → auto-restore via `/auth/profile`
2. **Admin/Vendor**: Separate logins, 8h tokens, `AdminContext` / `VendorContext`
3. OTP flow: POST `/auth/send-otp`, then POST `/auth/verify-otp` with email/phone

**Revocation.** Tokens are no longer "valid until they expire". Two signals live on
the user document that every guard already reads, so revocation costs **no extra
Firestore read** on the authenticated hot path:

| Field | Meaning |
|-------|---------|
| `tokenVersion` | Bumped to kill **every** session (password reset, suspension, account deletion, "log out everywhere") |
| `revokedSessions` | Individual session ids, so signing out on one device leaves the others alone. Self-pruning — entries drop once the access token they refer to has expired |

Rules:
- Any route that must honour revocation has to run `loadPrincipal` (or `authenticateAdmin` / `authenticateVendor`). `authenticate` alone only proves the signature. `/auth/logout` is the deliberate exception, so a suspended account can still end its own session.
- Anything that invalidates trust in a credential must call `revokeAllSessions()` — password reset, suspension and account deletion already do.
- Access tokens are capped at 24h and configured by `ACCESS_TOKEN_TTL`, **not** `JWT_EXPIRE`. Long sessions come from `REFRESH_TOKEN_TTL_DAYS`.
- `sessions` is purged opportunistically at login and in bulk by `npm run purge:sessions`.

### Booking Flow
1. Search → Select item (flight/hotel) → Fill details (passengers/dates) → Review price
2. POST `/bookings/{type}` with userId, itemId, quantity (passengers/rooms/nights), totalPrice
3. Backend: Validate availability → decrement atomically → create booking record → return bookingId
4. Frontend: Show success toast, redirect to confirmation page, send email notification

## Performance Notes
- Use React Query for server state (caching, refetch on window focus)
- Lazy-load page components with React.lazy() + Suspense
- Memoize expensive calculations (useMemo)
- Debounce search/filter inputs (250-500ms)
- Compress images, use WebP format where possible
- In-memory search filtering for <10k results; use backend pagination for larger datasets

## Security Checklist
- [ ] JWT secret changed before production
- [ ] No `.env` file is tracked by git; leaked credentials rotated
- [ ] CORS_ORIGIN restricted to frontend domain only
- [ ] Admin endpoints protected with `authenticateAdmin` + `adminOnly` middleware
- [ ] Booking endpoints verify user owns resource (userId check)
- [ ] Passwords hashed with bcrypt (salt rounds ≥ 10)
- [ ] Firestore security rules defined (not in test mode)
- [ ] Never log sensitive data (tokens, passwords, PII)
- [ ] HTTPS enforced in production
- [ ] Rate limiting on auth endpoints (brute-force protection)
- [ ] Input sanitization on user-facing endpoints
