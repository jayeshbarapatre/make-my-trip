# Firebase Platform Report — MakeMyTrip-Style Booking Platform

**Date:** 2026-07-28
**Mandate:** Make the platform behave like a professional travel booking application end-to-end, with **Firebase/Firestore as the only database and source of truth**. No MongoDB, no Prisma in any user-facing runtime path, no duplicate auth systems.

---

## 1. Root Cause Analysis

The codebase had **three databases wired at once** (Firestore, MongoDB via Prisma, plus a mock-data mode), switched per-route by `USE_FIREBASE`. Firestore was fully seeded (150 flights, 428 hotels, 200 buses, 200 cabs, 500 trains) but several core paths never reached it:

| # | Root cause | Symptom |
|---|-----------|---------|
| 1 | Firestore rejects `undefined` values and `ignoreUndefinedProperties` was never enabled | **Every booking without a `transactionId` failed with a 500.** This is why the frontend leaned on localStorage as a booking store. |
| 2 | `getUserBookings` used `where(userId) + orderBy(createdAt)` — requires a composite index that was never created | **My Trips backend fetch always failed** (`FAILED_PRECONDITION`), silently falling back to localStorage. |
| 3 | The flights route was hardwired to Prisma + the Aviationstack live API (never gated by `USE_FIREBASE`); no `firebaseFlightController` existed | The seeded Firestore `flights` collection was never used; flight-details lookups for live-API IDs returned a hardcoded Delhi→Mumbai stub; DB fallback crashed (no `DATABASE_URL`). |
| 4 | `/user/profile`, `/user/update`, `/user/bookings` used Prisma with Mongo ObjectID validation | Profile page errored: `Malformed ObjectID ... "user_…"`. |
| 5 | `firebaseGetProfile` returned `{data: {…}}` but the frontend expects `{data: {user: {…}}}` | **Session restore silently failed on every page refresh** — users were logged out despite a valid token. |
| 6 | `notificationService` imported `emailQueue`, a constant `null` (lazy init never invoked); email logs went to Prisma | **No booking email was ever sent**, even though working SMTP credentials were configured. |
| 7 | Payment pages fell back to `usr_guest_<timestamp>` / hardcoded `usr_1111-2222-3333-4444` user IDs | Orphaned bookings not owned by any real user; violated UID-isolation. |
| 8 | `firebaseGetProfile` scanned the **entire users collection** per call | O(N) Firestore reads on every session restore. |
| 9 | No availability decrement in the Firebase booking path | Overbooking possible. |
| 10 | No `firestore.rules` file existed | No defined security posture. |

## 2. Bugs Fixed

1. **Booking persistence** — `db.settings({ ignoreUndefinedProperties: true })` + explicit `null` defaults; all five booking types now save to Firestore reliably.
2. **My Trips** — index-free query (sort in memory); backend is now the authoritative source, localStorage only an offline cache.
3. **Flights on Firestore** — new `firebaseFlightController` (search/filter/paginate/details) over the seeded `flights` collection, with normalization to the frontend shape (`{city, time}`, `"2h 15m"`).
4. **Session restore** — profile response now returns `{data: {user}}`; refresh keeps you logged in.
5. **User profile** — new `firebaseUserController` (get/update) on Firestore; removed the fake offline profile fallback that masked errors.
6. **Emails** — booking confirmations + welcome + password-reset OTP now send directly via nodemailer (fire-and-forget, never blocks a booking). Verified real SMTP delivery.
7. **Forgot/Reset password** — implemented in Firebase mode (email OTP, 10-min expiry, attempt limits, anti-enumeration response); previously 501.
8. **Guest IDs eliminated** — payment/success pages require login (redirect to `/login?returnTo=…`); backend derives owner from the JWT, never from the client payload.
9. **Atomic availability** — bookings decrement `seatsAvailable`/`roomsAvailable` in a Firestore transaction; insufficient availability returns 400 (verified 132→130 for a 2-passenger booking).
10. **Payment verify** — Razorpay signature verification is Firebase-only, idempotent per payment ID, with optional-auth so the token (when present) always wins over client-sent userId.
11. **Profile lookup** — O(N) collection scan replaced with `where('id','==',uid).limit(1)`.
12. **Admin bookings list** — repointed from Prisma to Firestore.
13. **Removed security hole** — deleted the unauthenticated `/auth/debug/users` route (dumped all users) along with the Mongo auth path.

## 3. Files Modified / Created / Deleted

**Backend modified:** `src/config/firebase.js`, `src/middleware/auth.js` (added `optionalAuthenticate`), `src/controllers/firebaseAuthController.js`, `src/controllers/firebaseBookingController.js`, `src/controllers/paymentController.js`, `src/routes/{auth,bookings,flights,hotels,buses,cabs,trains,userRoutes,paymentRoutes,adminRoutes}.js`
**Backend created:** `src/controllers/firebaseFlightController.js`, `src/controllers/firebaseUserController.js`, `firestore.rules`, `scratch/e2e_test.sh` (26-check regression suite)
**Frontend modified:** `pages/FlightPaymentPage.jsx`, `pages/TrainPaymentPage.jsx`, `pages/BusBookingPage.jsx`, `pages/CabPaymentPage.jsx`, `pages/HotelPaymentPage.jsx`, `pages/{Cab,Hotel,Train}SuccessPage.jsx`, `services/authService.js`
**Deleted (dead code):** `src/index-{debug,debug2,debug3,debug4,file,http,minimal2,safe,test}.js`, `controllers/authController.SIMPLE.js`, `routes/bookingRoutes.js` (never registered), `pages/FlightPaymentPage-Razorpay.jsx` (unused duplicate), `pages/FlightPaymentPage.jsx.tmp.*`

## 4. Firestore Schema (source of truth)

- **users** (doc id = email): `{ id (UID: user_<ts>), email, name, phone, password (bcrypt), is_admin, createdAt, updatedAt }`
- **bookings** (doc id = `<uid>_<ts>` or auto): `{ bookingId (MMT-XX-nnnnnn), pnr, userId, type (flight|hotel|bus|train|cab), status (confirmed|cancelled), paymentStatus, paymentMethod, transactionId, totalAmount, baseFare, taxes, gst, convenience, discount, fromCity, toCity, departureDate, returnDate, travellers/passengers, userEmail, userName, createdAt, updatedAt, cancelledAt? }`
- **flights**: `{ airline, airlineCode, airlineLogo, flightNumber, source, destination, departure (ISO), arrival (ISO), duration (min), price, seats, stops, class, baggage, isActive }`
- **hotels**: `{ name, city, location, price/pricePerNight, rating, reviews, rooms/roomsAvailable, amenities, images, isActive }`
- **buses**: `{ busName, from, to, departureTime, arrivalTime, durationMinutes, price, seatsAvailable, busType, totalSeats, isActive }`
- **trains**: `{ trainName, trainNumber, from, to, departureTime, arrivalTime, durationMinutes, price, seatsAvailable, trainClass, isActive }`
- **cabs**: `{ from, to, type, price, capacity, driver, rating, phone, vehicleNumber, estimatedTime, isActive }`
- **otps**: `{ phone|email, otp, purpose, expiresAt, attempts, maxAttempts, createdAt }` — mobile-login and password-reset codes

## 5. Authentication Flow

Single system, no duplicates: **Express + JWT backed by Firestore `users`**.
Register/Login → bcrypt-verified against Firestore → JWT (`{id: <UID>}`, 7d) → localStorage → auto-restore via `GET /auth/profile` → logout clears client state. Mobile OTP login and email-OTP password reset both use the Firestore `otps` collection. Every protected endpoint derives the user from the verified JWT (`req.userId`); client-supplied user IDs are ignored.

## 6. Security Improvements

- `firestore.rules` created: catalog collections read-only; users/bookings owner-scoped; OTPs server-only; default deny. (All current access goes through the Admin SDK server-side; the rules lock out any direct client access.)
- Booking read/cancel enforce `booking.userId === req.userId` (verified: cross-user read → 403).
- Removed `/auth/debug/users` (unauthenticated dump of all users).
- Anti-enumeration forgot-password response; OTP attempt limits and expiry.
- Guest/hardcoded user IDs removed from every payment flow.

## 7. Performance Improvements

- Session-restore profile lookup: full collection scan → single indexed query.
- My Trips: no composite-index dependency; single equality query.
- Flight search no longer blocks ~6 s on an external API before falling back.
- Emails are fire-and-forget — bookings never wait on SMTP.

## 8. UI/UX Improvements

- Unauthenticated users are redirected to login (with `returnTo`) before payment instead of silently creating orphan bookings.
- Profile/My Trips show real errors instead of fake fallback data.
- Booking flows unchanged visually (already MMT-style multi-step with progress bars, toasts, skeletons, PDF tickets via html2canvas/jsPDF, DaisyUI theming for light/dark).

## 9. Testing Report

`makemytrip-backend/scratch/e2e_test.sh` — **26/26 passed** against the live server:

- 2 fresh users registered + logged in; wrong password rejected; session restore verified.
- All 5 categories searched **and booked from Firestore** (flight, hotel, train, bus, cab).
- Flight seats atomically decremented (81 → 80).
- My Trips isolation: Alice sees exactly her 5 bookings, Bob sees 0, Bob reading Alice's booking → 403, unauthenticated → 401.
- Cancel + double-cancel-rejection verified.
- Profile update persisted.
- Full password-reset loop: OTP generated → password changed → login with new password.
- Real SMTP delivery confirmed (booking-confirmation message ID returned by Gmail).
- Frontend production build passes (`vite build`, 1105 modules).

## 10. Final Confirmation

The complete user journey — register → login → search → book (all 5 categories) → pay (Razorpay) → confirmation → PDF → email → My Trips → details → cancel → profile → logout → login again — now runs **entirely on Firebase/Firestore as the single source of truth**, with per-UID data isolation enforced server-side.

**Known remaining scope (flagged, not silently ignored):** the **admin and vendor portals** (`/admin/*` CRUD, vendor routes, dashboard stats, CMS, FAQs) still contain Prisma-based controllers. The admin *bookings list* was moved to Firestore; converting the remaining ~20 admin/vendor controllers is a separate workstream and does not affect the user-facing platform, which no longer touches MongoDB/Prisma anywhere.
