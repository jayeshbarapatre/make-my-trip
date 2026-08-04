# Production Roadmap

**Status:** awaiting approval — no implementation will begin until this is signed off.
**Baseline:** commit `6163630`, branch `feature/next-task`, audited 2026-08-03.
**Sequencing rule:** Critical Bugs → Security → Data Integrity → Booking Engine → Authentication → Payments → Email → PDF → Admin → Vendor → Customer → UI/UX → Performance → Testing → Production Readiness.

Each milestone is scoped to 2–6 hours and is independently shippable. A milestone is not
complete until its acceptance criteria pass *and* the full regression suite still passes.

---

## Standing risks (apply to every milestone)

| # | Risk | Mitigation |
|---|---|---|
| R1 | **122 files uncommitted**, including `pricingService`, `bookingService`, `secrets.js`, Docker, CI and all Phase 0 fixes. A stray `git checkout` destroys the entire hardening effort. | Resolve before M3. Not actioned — you asked me to commit only mentally. |
| R2 | **Server cannot boot.** `SMTP_USER/PASS`, `RAZORPAY_KEY_ID/SECRET`, `AVIATIONSTACK_API_KEY` still match values published in commit `7a28d2b`. | **Blocker — needs your provider logins.** See `SECURITY_ROTATION.md`. |
| R3 | **I am blocked from starting the server** by the permission classifier, so HTTP-layer tests (`tests/security.test.mjs`, Playwright) cannot run. | **Blocker — needs a Bash permission rule** for `node src/index.js`. |
| R4 | Tests run against the **live Firestore project**. There is no emulator or separate test project. | M19 introduces `TEST_PROJECT_IDS` + emulator. Until then all test data is prefixed and cleaned up. |
| R5 | Single Firestore project for dev and prod. | M20 splits environments. |

---

## Phase 0 — COMPLETE (already delivered)

| ID | Milestone | Outcome |
|----|-----------|---------|
| M1 | Critical Bugs | Email identity canonicalised (13 sites, 4 records migrated); cancellation race fixed (reproduced 21 phantom seats → now exactly 1 release); phone login de-scanned (indexed `phoneE164`, 47 backfilled); hardcoded `localhost:5000` removed; PDF download wired to real endpoint; phone format validated |
| M2 | Security | Password-reset OTP bypass closed (`consume:false`); suspended accounts refused at login; 8 raw-exception leaks removed; single password policy |
| M2.5 | Test harness | `npm test` wired; `tests/regression.test.mjs` — 15 tests, all passing, one per defect; cancel-race test verified non-vacuous |

---

## Phase 1 — Data Integrity

### M3 — Retire the dead ORM layer and legacy inventory

**Estimate:** 2–3 h

**Goal**
Remove the Mongoose/Prisma remnants that contradict the Firestore-only policy in `CLAUDE.md`, and purge the legacy cab inventory that predates the route seeder. Both are live sources of confusion: `src/models/` defines five Mongoose schemas nothing reads, and 10 cab documents carry ₹30 fares on `City → Airport` pseudo-routes.

**Files**
- `makemytrip-backend/src/models/{Admin,Flight,Hotel,User,Vendor}.js` — delete
- `makemytrip-backend/src/config/{db.js,prismaClient.js}` — delete or reduce to a no-op with a comment
- `makemytrip-backend/src/index.js` — remove the `connectDB()` call
- `makemytrip-backend/package.json` — drop `mongoose`, `@prisma/client`, `prisma`
- `makemytrip-backend/scripts/seedCabsFirebase.js`, `seedMongoDB.js` — delete (superseded)
- `makemytrip-backend/scripts/pruneLegacyCabs.js` — new, dry-run-first
- `CLAUDE.md` — update the "legacy Prisma controllers remain" note, now false

**Collections:** `cabs`

**APIs:** none changed. `GET /api/v1/cabs` results must be identical minus the junk records.

**Risks**
- `connectDB()` may be doing something non-obvious at boot — verify it is genuinely unused before removal.
- Deleting `node_modules` entries changes the lockfile; a failed `npm ci` in CI would be a self-inflicted outage.
- Legacy cab deletion is irreversible. Dry-run must be reviewed by you before `--apply`.

**Test cases**
1. `npm test` — full regression suite still green.
2. Server boots with `connectDB` removed (blocked by R2/R3 — falls back to module-load check).
3. `GET /cabs?from=Delhi&to=Jaipur` returns the same 5 seeded cabs.
4. No cab in `cabs` has `price < 200` or `to` in `{Airport, Hotel, Beach, Market, Park, City Center, Railway Station, Bus Stand}`.
5. `grep -r "mongoose\|prisma" src/` returns nothing.
6. `npm ci` succeeds from a clean `node_modules`.

**Acceptance criteria**
- [ ] Zero Mongoose/Prisma imports anywhere in `src/`
- [ ] `package.json` has no ORM dependency; `npm ci` clean
- [ ] Legacy cab count = 0; seeded route cab count = 240
- [ ] Regression suite green
- [ ] `CLAUDE.md` reflects reality

---

### M4 — Booking document schema convergence

**Estimate:** 3–4 h

**Goal**
One booking shape. Bookings currently carry `type` *and* `bookingType`, `status` *and* `bookingStatus`, and item ids under five different keys (`flightId`, `hotelId`, `busId`, `trainId`, `cabId`, `itemId`). Every consumer re-implements the same defensive fallbacks (`resolveItemId`, `availabilityField`, `bookedQuantity`), and each fallback is a place a new vertical can silently diverge.

**Files**
- `makemytrip-backend/src/services/bookingService.js` — canonical shape + `normalizeBookingDoc()`
- `makemytrip-backend/src/controllers/firebaseBookingController.js`
- `makemytrip-backend/src/controllers/documentController.js`
- `makemytrip-backend/src/services/{refundService,reportService}.js`
- `makemytrip-backend/src/controllers/dashboardController.js`
- `makemytrip-backend/scripts/migrateBookingSchema.js` — new, dry-run-first
- `makemytrip-frontend/src/components/BookingCard.jsx`, `src/pages/MyTrips.jsx`

**Collections:** `bookings` (46 live documents), `refunds`

**APIs:** `GET /bookings/:id`, `GET /bookings/user/:userId`, `POST /payment/verify`, `GET /documents/bookings/:id/{ticket,invoice}`

**Risks**
- **Highest-risk milestone in Phase 1.** Touching the booking document touches money, tickets and refunds simultaneously.
- 46 live bookings must remain readable throughout — migration must be additive first (write both shapes), then read-new, then drop-old across three deploys, not one.
- The PDF and refund paths read fields directly; a missed reference produces a blank ticket rather than an error.

**Test cases**
1. Every existing booking still renders a ticket PDF byte-identically before/after.
2. Refund quote for each of the 46 bookings is unchanged.
3. New booking via `POST /payment/verify` writes only canonical fields.
4. `MyTrips` renders all 46 without a missing-field fallback firing.
5. Migration dry-run reports zero ambiguous documents.
6. Rollback: reverting the read layer still works against migrated documents.

**Acceptance criteria**
- [ ] One canonical field per concept, documented in `CLAUDE.md`
- [ ] `resolveItemId` fallback chain reduced to a single key
- [ ] All 46 bookings migrated, zero data loss (count + total-value checksum before/after)
- [ ] Ticket and invoice PDFs unchanged for a sampled 10 bookings
- [ ] Regression suite green + 6 new schema tests

---

### M5 — Firestore rules deployment and index management

**Estimate:** 2–3 h

**Goal**
`makemytrip-backend/firestore.rules` exists and is well written — but there is no `firebase.json`, no deploy step, and no evidence it has ever been pushed. Rules that are not deployed are documentation. Also codify the composite indexes the codebase deliberately avoids, so the `where + orderBy` prohibition in `CLAUDE.md` becomes a choice rather than a constraint.

**Files**
- `firebase.json` — new (rules + indexes targets)
- `makemytrip-backend/firestore.rules` — review; `request.auth` is always null since the app uses custom JWTs, so confirm intent is "deny all direct client access"
- `firestore.indexes.json` — new
- `.github/workflows/deploy-rules.yml` — new
- `CLAUDE.md` — replace the "avoid where+orderBy" rule with "add an index"

**Collections:** all 19 (`users`, `bookings`, `refunds`, `hotels`, `vendor_requests`, `flights`, `coupons`, `support_tickets`, `payments`, `reviews`, `wishlists`, `trains`, `buses`, `notifications`, `cabs`, `settings`, `room_categories`, `emailLogs`, `audit_logs`)

**APIs:** none directly; unblocks `orderBy` in `getUserBookings`, `getAllBookings`, admin listings.

**Risks**
- **Deploying rules can lock out the running application** if any path relies on client SDK access. Audit first: all current access is Admin SDK, which bypasses rules — but verify no frontend imports `firebase/firestore`.
- Index builds on large collections take minutes and are not instant.
- A wrong default-deny rule is an outage, not a degradation.

**Test cases**
1. `grep -r "firebase/firestore\|firebase/app" makemytrip-frontend/src` returns nothing (confirms no direct client access).
2. Rules deploy to a scratch project first; smoke-test all read paths.
3. Direct client read of `bookings` with a forged token is denied.
4. Direct client read of `flights` succeeds (public catalog).
5. `audit_logs`, `otps`, `coupons` deny read to every client identity.
6. `getUserBookings` with `orderBy('createdAt','desc')` succeeds once indexed.

**Acceptance criteria**
- [ ] `firebase deploy --only firestore:rules,firestore:indexes` succeeds
- [ ] Emulator-based rules test proves owner-isolation on `bookings`, `refunds`, `wishlists`
- [ ] In-memory sorts in `getUserBookings`/`getAllBookings` replaced by indexed `orderBy`
- [ ] CI deploys rules on merge to `main`

---

## Phase 2 — Booking Engine

### M6 — Cab inventory model *(contains a business decision — see below)*

**Estimate:** 3–5 h

**Goal**
Decide and implement what cab availability means. Today `RESOURCE_COLLECTIONS` in `bookingService.js` has no `cab` entry, so **cab bookings reserve nothing** — 5 cab bookings exist and not one decremented inventory. Cabs are infinitely sellable.

> **DECISION REQUIRED FROM YOU.** A cab document is currently a *route + vehicle-class template*
> (`New Delhi → Jaipur, Sedan`), not a physical vehicle, and carries no date dimension. There are
> three coherent models and they are not interchangeable:
>
> **(a) Unlimited (aggregator model).** Cabs are sourced on demand from partners; no inventory cap.
> Cheapest — make the current behaviour explicit and documented, add nothing.
> **(b) Daily capacity per route+class.** A `cab_availability/{cabId}_{date}` document with a
> per-day count. Medium effort, matches how outstation cabs are actually sold.
> **(c) Physical fleet.** Vehicles as first-class documents with assignment and calendar.
> Largest effort; only worth it if vendors manage real fleets.
>
> **My recommendation: (b).** It prevents overselling a route on a date without inventing a fleet
> management system the vendor portal cannot yet feed.

**Files** *(assuming (b))*
- `makemytrip-backend/src/services/bookingService.js` — add `cab` to `RESOURCE_COLLECTIONS`, date-aware reservation
- `makemytrip-backend/src/controllers/firebaseCabController.js` — filter by date availability
- `makemytrip-backend/src/controllers/cabAdminController.js`, `vendorCabController.js` — capacity field
- `makemytrip-backend/scripts/seedCabsFirestore.js` — seed capacity
- `makemytrip-frontend/src/pages/CabSearchResultsPage.jsx` — pass travel date to search

**Collections:** `cabs`, new `cab_availability`, `bookings`

**APIs:** `GET /cabs`, `POST /payment/verify` (cab), `POST /bookings/cabs`, admin/vendor cab CRUD

**Risks**
- Choosing (c) later after building (b) is a second migration — decide once.
- Cab search currently ignores the travel date entirely; adding date filtering changes result counts and may surface "no cabs" on dates with no capacity row. Needs a sensible default (unlimited until capacity is set).
- The 5 existing cab bookings have no reservation to reconcile against.

**Test cases**
1. Booking a cab decrements that route+class+date capacity.
2. Concurrent cab bookings cannot oversell (8-way race, mirroring the M1 cancel test).
3. Cancelling a cab booking restores capacity exactly once.
4. A route with no capacity row behaves per the chosen default and is documented.
5. Cab search on a sold-out date excludes that cab.
6. Existing 5 cab bookings remain readable and refundable.

**Acceptance criteria**
- [ ] Chosen model documented in `CLAUDE.md`
- [ ] Cab bookings reserve and release symmetrically, proven under concurrency
- [ ] No regression in cab search latency or result counts on available dates
- [ ] Regression suite green + 6 new cab-inventory tests

---

### M7 — Cancellation and refund lifecycle completion

**Estimate:** 4–5 h

**Goal**
`refundService.js` implements a full state machine (`quoteRefund` → `openRefund` → `transitionRefund` → `executeGatewayRefund` → `confirmGatewayRefund`) but nothing drives it end to end automatically, and there is exactly **1 refund document** against 46 bookings. Close the loop: cancellation opens a refund, an admin approves, the gateway executes, and the customer is notified — with every transition audited.

**Files**
- `makemytrip-backend/src/services/refundService.js`
- `makemytrip-backend/src/controllers/refundController.js`
- `makemytrip-backend/src/routes/refunds.js`
- `makemytrip-backend/src/services/emailService.js` — refund-status emails
- `makemytrip-frontend/src/pages/AdminRefunds.jsx` — replace `window.prompt` with a real form
- `makemytrip-frontend/src/pages/MyTrips.jsx` — surface refund status to the customer

**Collections:** `bookings`, `refunds`, `payments`, `audit_logs`

**APIs:** `PUT /bookings/cancel/:id`, `GET /refunds`, `POST /refunds/:id/approve|reject|execute`, `GET /documents/refunds/:id/receipt`

**Risks**
- **Real money.** `razorpay.payments.refund` is irreversible. Every path must be idempotent — a double-click must not refund twice.
- Gateway refunds are asynchronous; the confirm step depends on a webhook that does not yet exist (M10). Until then, confirmation is manual/polled.
- Partial refunds and cancellation fees must reconcile to the captured amount exactly, or the ledger drifts.

**Test cases**
1. Cancel → refund opens with server-computed amount; client cannot influence it.
2. Double-cancel opens exactly one refund (mirrors M1 idempotency).
3. Illegal transitions (`pending → completed`) are rejected by `canTransition`.
4. `executeGatewayRefund` called twice refunds once.
5. Refund amount + cancellation fee = captured amount, for every policy branch.
6. Refund receipt PDF matches the refund document.
7. Every transition writes an `audit_logs` entry with actor and reason.

**Acceptance criteria**
- [ ] Cancellation → refund → payout works end to end in Razorpay test mode
- [ ] Idempotent at every step, proven under concurrency
- [ ] `AdminRefunds` uses a real form (no `window.prompt`)
- [ ] Customer sees refund status and ETA in `MyTrips`
- [ ] Ledger reconciliation test passes for all 46 bookings

---

### M8 — Search and availability parity across all five verticals

**Estimate:** 4–6 h

**Goal**
Flights, hotels, buses, trains and cabs each have their own search controller with divergent filtering, pagination, sorting and availability semantics. Bring them to one contract so a filter bug fixed in one is fixed in all.

**Files**
- `makemytrip-backend/src/controllers/firebase{Flight,Hotel,Bus,Train,Cab}Controller.js`
- `makemytrip-backend/src/services/unifiedSearchService.js`
- `makemytrip-backend/src/utils/validation.js`
- `makemytrip-frontend/src/pages/{SearchResults,HotelListing,BusSearchResults,TrainResults,CabSearchResults}Page.jsx`

**Collections:** `flights`, `hotels`, `buses`, `trains`, `cabs`

**APIs:** `GET /api/v1/{flights,hotels,buses,trains,cabs}`, `GET /api/v1/search`

**Risks**
- Five UIs consume five slightly different response shapes; a unified contract breaks all five at once if rolled out together. Roll out per-vertical.
- Date filtering is inconsistent — flights filter by date, cabs ignore it entirely. Adding it changes result sets users may be used to.
- In-memory filtering is used everywhere; unifying without pagination changes could regress performance on `flights` (162 docs today, but unbounded).

**Test cases**
1. Each vertical returns the same envelope: `{ data, pagination: { page, limit, total, pages } }`.
2. Invalid `page`/`limit` clamp identically across all five.
3. Sold-out inventory is excluded identically across all five.
4. Unified search returns results from every vertical for a common city pair.
5. Pagination boundary: `page=N+1` returns empty, not an error.
6. Each frontend listing page renders unchanged against the new envelope.

**Acceptance criteria**
- [ ] One documented search contract; all five conform
- [ ] Shared validation for city/date/pagination
- [ ] No frontend regression across all five listing pages
- [ ] Search latency ≤ current baseline

---

## Phase 3 — Authentication

### M9 — Session lifecycle: revocation and refresh

**Estimate:** 3–4 h

**Goal**
Tokens are 7-day, stateless, and irrevocable. `POST /auth/logout` returns a message and does nothing server-side. A stolen token is valid for a week with no way to kill it. `loadPrincipal` re-reads role and status per request (good), but that only covers routes that use it.

**Files**
- `makemytrip-backend/src/controllers/firebaseAuthController.js`
- `makemytrip-backend/src/middleware/auth.js`, `adminAuth.js`, `vendorAuth.js`
- `makemytrip-backend/src/services/tokenService.js` — new (jti issue/revoke/check)
- `makemytrip-frontend/src/context/AuthContext.jsx`, `src/services/api.js`

**Collections:** `users`, new `revoked_tokens` (TTL-based)

**APIs:** `POST /auth/login`, `POST /auth/logout`, `POST /auth/refresh` (new), `GET /auth/profile`

**Risks**
- A revocation check on every request adds a Firestore read to the hot path. Mitigate with a `tokenVersion` integer on the user document (already read by `loadPrincipal`) rather than a separate collection lookup.
- Shortening token lifetime without a refresh flow logs every active user out.
- `authenticate` alone (no `loadPrincipal`) guards several routes — those need the check too.

**Test cases**
1. Logout invalidates the token; the next request with it returns 401.
2. Password reset invalidates all existing sessions.
3. Suspending an account invalidates its sessions immediately.
4. Refresh issues a new token and rotates the old one.
5. A revoked token cannot be refreshed.
6. Hot-path latency does not regress (no extra read per request).

**Acceptance criteria**
- [ ] Logout is server-authoritative
- [ ] Password change and suspension both terminate live sessions
- [ ] Access-token lifetime reduced to ≤ 24 h with working refresh
- [ ] Zero additional Firestore reads on the authenticated hot path

---

### M10 — Token storage and XSS surface

**Estimate:** 2–3 h

**Goal**
JWTs live in `localStorage` (`src/services/api.js`, `AuthContext`, `AdminContext`, `VendorContext`), readable by any injected script. The app renders user-authored content (reviews, support tickets, CMS) and has `RichTextEditor` with a `prompt('URL:')` that accepts arbitrary hrefs — a `javascript:` URL is one click from token theft.

**Files**
- `makemytrip-frontend/src/services/api.js`, `src/config/api.config.js`
- `makemytrip-frontend/src/context/{Auth,Admin,Vendor}Context.jsx`
- `makemytrip-frontend/src/components/Admin/RichTextEditor.jsx`
- `makemytrip-backend/src/index.js` — cookie parsing, CSRF, CSP header
- `makemytrip-backend/src/controllers/firebaseAuthController.js` — set/clear cookie

**Collections:** none

**APIs:** all authenticated endpoints (auth transport changes)

**Risks**
- **Highest blast radius in Phase 3.** Moving to `httpOnly` cookies changes auth for every request, including admin and vendor portals, and introduces CSRF as a new concern that did not previously exist.
- Cross-origin cookies need `SameSite=None; Secure`, which needs HTTPS — cannot be validated on plain `localhost`.
- Three separate contexts store three separate tokens; all must move together or sessions fragment.

**Test cases**
1. Token is not reachable from `document.cookie` or `localStorage` in the browser console.
2. Authenticated request succeeds with cookie only, no `Authorization` header.
3. Cross-site form POST without a CSRF token is rejected.
4. `RichTextEditor` rejects `javascript:` and `data:` hrefs.
5. CSP header blocks inline script execution.
6. Admin, vendor and customer sessions remain independent.

**Acceptance criteria**
- [ ] No JWT in `localStorage` anywhere in the frontend
- [ ] CSRF protection on all state-changing requests
- [ ] CSP header present and enforced
- [ ] All three portals log in, act and log out correctly

---

## Phase 4 — Payments

### M11 — Razorpay webhook ingestion

**Estimate:** 4–5 h

**Goal**
Payment state is only learned when the browser returns to `POST /payment/verify`. If the customer closes the tab after paying, the money is captured and **no booking exists** — the platform has taken payment for nothing and has no way to notice. A webhook is the only reliable source of payment truth.

**Files**
- `makemytrip-backend/src/controllers/paymentController.js`
- `makemytrip-backend/src/routes/paymentRoutes.js` — raw-body route for signature verification
- `makemytrip-backend/src/index.js` — `express.raw` before `express.json` for the webhook path only
- `makemytrip-backend/src/services/bookingService.js` — reuse `createBookingForPayment`
- `makemytrip-backend/src/config/razorpay.js` — webhook secret

**Collections:** `payments`, `bookings`, `audit_logs`

**APIs:** `POST /api/v1/payment/webhook` (new, unauthenticated + signature-verified)

**Risks**
- **Body parsing order.** `express.json` is mounted globally; the webhook needs the raw body for HMAC. Getting this wrong silently fails every signature.
- Webhooks retry — the handler must be idempotent. `createBookingForPayment` is already keyed `pay_{paymentId}`, which helps.
- Webhook and browser-return can race for the same payment; both must converge on one booking.
- An unauthenticated public endpoint is new attack surface; it must be rate-limited and reject unsigned payloads without doing work.

**Test cases**
1. Valid signed `payment.captured` creates the booking.
2. Invalid signature → 400, nothing written.
3. Same webhook delivered 5× creates exactly one booking.
4. Webhook and `POST /verify` racing produce one booking with one payment record.
5. Abandoned checkout (payment captured, tab closed) still yields a booking + confirmation email.
6. `payment.failed` marks the payment without creating a booking.

**Acceptance criteria**
- [ ] Webhook verified against `RAZORPAY_WEBHOOK_SECRET`
- [ ] Idempotent under replay, proven with 5 deliveries
- [ ] Abandoned-checkout scenario produces a complete booking
- [ ] Every webhook logged to `audit_logs`

---

### M12 — Payment reconciliation and orphan detection

**Estimate:** 3–4 h

**Goal**
There is no way to answer "did every captured payment become a booking, and does every booking have a captured payment?" With 5 `payments` documents and 46 `bookings`, the two sets are already not obviously reconcilable. Build the report before scaling.

**Files**
- `makemytrip-backend/src/services/reconciliationService.js` — new
- `makemytrip-backend/src/controllers/reportController.js`
- `makemytrip-backend/src/routes/reports.js`
- `makemytrip-backend/scripts/reconcilePayments.js` — new, read-only
- `makemytrip-frontend/src/pages/AdminReports.jsx`

**Collections:** `payments`, `bookings`, `refunds`

**APIs:** `GET /api/v1/reports/reconciliation`

**Risks**
- Historical data predates the current payment flow; expect legitimate orphans that need classification, not "fixing".
- Reconciliation over unbounded collections is expensive — must paginate by date range.
- Read-only by design. It must never auto-repair; a wrong auto-repair on money data is worse than a report nobody reads.

**Test cases**
1. Captured payment with no booking is flagged.
2. Booking with no payment record is flagged.
3. Booking whose `totalAmount` ≠ payment `amountCaptured` is flagged.
4. Refunded booking is not flagged as an orphan.
5. Report over the live 46 bookings + 5 payments produces a classified list.
6. Report is read-only — no writes to any collection.

**Acceptance criteria**
- [ ] Reconciliation report available to admins, filterable by date
- [ ] Current live discrepancies enumerated and each one classified
- [ ] Runs without a full-collection scan
- [ ] Provably side-effect free

---

## Phase 5 — Email

### M13 — Transactional email reliability

**Estimate:** 3–4 h

**Goal**
Email is fire-and-forget with `.catch(console.warn)`. A booking confirmation that fails to send is lost — the customer has paid and has no ticket, and nobody knows. `emailLogs` exists but is written from one place. Make delivery observable and retryable.

**Files**
- `makemytrip-backend/src/services/emailService.js`
- `makemytrip-backend/src/services/email/{mailer,emailLogService,templateService}.js`
- `makemytrip-backend/src/controllers/emailLogAdminController.js`
- `makemytrip-frontend/src/pages/AdminSettings.jsx` — email log view + resend

**Collections:** `emailLogs`, `bookings`

**APIs:** `GET /api/v1/admin/email-logs`, `POST /api/v1/admin/email-logs/:id/resend`

**Risks**
- **Blocked by R2** — SMTP credentials are compromised and must be rotated before any delivery test.
- Known constraint from prior work: the test Gmail inbox is over quota and cannot receive mail. Needs a working test mailbox or a capture service.
- Retry without idempotency sends duplicate confirmations to customers.

**Test cases**
1. Every send attempt writes an `emailLogs` row with outcome.
2. A failed send is retryable from the admin UI and does not duplicate on success.
3. Booking confirmation failure raises an operational signal, not just a console warning.
4. Template rendering failure is caught and logged, not thrown into the payment path.
5. Bounce/rejection is recorded against the log row.

**Acceptance criteria**
- [ ] 100% of sends logged with status
- [ ] Admin can view and resend failed email
- [ ] A confirmation-email failure never fails or reverses a paid booking
- [ ] Retry is idempotent

---

## Phase 6 — PDF

### M14 — Document generation hardening

**Estimate:** 2–3 h

**Goal**
`pdfService.js` (PDFKit, server-side) is the correct implementation, and `documentService` on the frontend uses it. But `src/utils/pdfDownload.js` still does browser-side html2canvas + jsPDF, and several success pages still call it — producing non-selectable screenshot PDFs with no invoice number. Consolidate on the server renderer and retire the client one.

**Files**
- `makemytrip-backend/src/services/email/pdfService.js`
- `makemytrip-backend/src/controllers/documentController.js`
- `makemytrip-frontend/src/utils/pdfDownload.js` — delete after migration
- `makemytrip-frontend/src/pages/{Flight,Hotel,Train,Cab,Bus}SuccessPage.jsx`
- `makemytrip-frontend/src/components/ConfirmationTicket.jsx`

**Collections:** `bookings`, `refunds`

**APIs:** `GET /documents/bookings/:id/{ticket,invoice}`, `GET /documents/refunds/:id/receipt`

**Risks**
- Removing `jspdf`/`html2canvas` drops ~600 kB from the bundle — a win, but only if every caller is migrated first.
- Invoice numbering must be sequential and gap-free for tax purposes; generating it per-request risks duplicates under concurrency.
- PDFs for the 46 existing bookings must still render after M4's schema change.

**Test cases**
1. Ticket PDF renders for all five booking types.
2. Text in the PDF is selectable (not a raster screenshot).
3. Invoice numbers are unique and sequential under 10 concurrent requests.
4. A booking belonging to another user returns 404, not a PDF.
5. Refund receipt matches the refund document.
6. `jspdf` and `html2canvas` no longer appear in the production bundle.

**Acceptance criteria**
- [ ] One PDF path (server-side) for all documents
- [ ] Invoice numbering concurrency-safe
- [ ] Bundle reduced by the removed libraries
- [ ] Ownership enforced on every document endpoint

---

## Phase 7 — Admin

### M15 — Admin destructive-action safety and confirmation UX

**Estimate:** 3–4 h

**Goal**
Admin deletions use `window.confirm` across 8 pages (`AdminFlights`, `AdminHotels`, `AdminBuses`, `AdminCabs`, `AdminTrains`, `AdminFaqs`, `AdminHotelRooms`, `AdminCoupons`), and `AdminRefunds`/`AdminVendorRequests` collect a customer-visible reason via `window.prompt`. These are hard deletes on inventory that live bookings may reference.

**Files**
- `makemytrip-frontend/src/pages/Admin*.jsx` (10 pages)
- `makemytrip-frontend/src/components/Admin/ConfirmDialog.jsx` — new
- `makemytrip-backend/src/controllers/factories/firestoreAdminCrud.js` — soft delete + referential guard

**Collections:** `flights`, `hotels`, `buses`, `trains`, `cabs`, `coupons`, `room_categories`, `bookings`, `audit_logs`

**APIs:** `DELETE /api/v1/admin/{flights,hotels,buses,trains,cabs}/:id`, refund and vendor-request decisions

**Risks**
- Deleting inventory with active bookings orphans those bookings and breaks their tickets — this is possible today.
- Switching to soft delete changes every admin list query; a missed `isDeleted` filter resurrects deleted records in the UI.

**Test cases**
1. Deleting inventory referenced by a confirmed booking is refused with a clear reason.
2. Soft-deleted records disappear from admin lists and public search.
3. Every delete writes an `audit_logs` entry with actor.
4. Refund rejection reason is captured in a form with validation, not `prompt`.
5. Confirmation dialog requires typing the resource name for irreversible actions.
6. No `window.confirm`/`window.prompt` remains in `src/pages/Admin*`.

**Acceptance criteria**
- [ ] Zero native `confirm`/`prompt` in admin pages
- [ ] Inventory with active bookings cannot be deleted
- [ ] All destructive actions audited
- [ ] Soft delete consistent across admin, vendor and public reads

---

### M16 — Admin dashboard data correctness

**Estimate:** 3–4 h

**Goal**
`dashboardController` computes stats, revenue and availability. With the M4 schema change and M12 reconciliation in place, verify these numbers are actually right — a dashboard that is confidently wrong is worse than none. Revenue in particular must agree with the payments ledger, not with booking documents.

**Files**
- `makemytrip-backend/src/controllers/dashboardController.js`
- `makemytrip-backend/src/services/reportService.js`
- `makemytrip-backend/src/utils/exporters.js`
- `makemytrip-frontend/src/pages/AdminDashboard.jsx`, `AdminReports.jsx`

**Collections:** `bookings`, `payments`, `refunds`, `users`

**APIs:** `GET /admin/dashboard/{stats,revenue,recent-bookings,availability}`, `GET /reports/*`

**Risks**
- Revenue must net refunds; counting gross as revenue overstates the business.
- Cancelled bookings must not count toward revenue but must count toward volume.
- Unbounded aggregation over `bookings` will not scale past a few thousand documents.

**Test cases**
1. Dashboard revenue = sum of captured payments − refunds, for a known fixture set.
2. Cancelled bookings excluded from revenue, included in booking count.
3. Date-range filters produce consistent totals across stats and reports.
4. Excel/CSV export matches the on-screen figures exactly.
5. Dashboard loads within budget with 5,000 synthetic bookings.

**Acceptance criteria**
- [ ] Revenue reconciles with the payments ledger to the rupee
- [ ] All aggregates date-bounded and paginated
- [ ] Exports match UI
- [ ] Dashboard p95 < 2 s at 5,000 bookings

---

## Phase 8 — Vendor

### M17 — Vendor isolation audit

**Estimate:** 3–4 h

**Goal**
`requireOwnVendorResource` in `rbac.js` is well designed, but it must be applied on *every* vendor route to matter. Audit all vendor endpoints for cross-tenant leakage — one unguarded route exposes every vendor's inventory and revenue to a competitor.

**Files**
- `makemytrip-backend/src/routes/vendorRoutes.js`
- `makemytrip-backend/src/controllers/vendor{Hotel,Cab,Bus,Room,Auth,Request}Controller.js`
- `makemytrip-backend/src/controllers/factories/firestoreVendorCrud.js`
- `makemytrip-backend/src/middleware/{vendorAuth,rbac}.js`

**Collections:** `users`, `hotels`, `cabs`, `buses`, `room_categories`, `vendor_requests`, `bookings`

**APIs:** all `/api/v1/vendor/*`

**Risks**
- Cross-tenant data leakage is a confidentiality breach with legal weight, not just a bug.
- `requireOwnVendorResource` needs a `resourceLoader` per route; a route that loads the resource itself and forgets the guard looks correct in review.

**Test cases**
1. Vendor A cannot read, update or delete any Vendor B resource — enumerated across every vendor endpoint.
2. Vendor A's listing endpoints return only Vendor A's records.
3. A vendor cannot self-assign `vendorId` via request body (mass assignment).
4. A pending (unapproved) vendor cannot access vendor endpoints.
5. An admin can access any vendor's resources.
6. Booking/revenue data is scoped to the vendor's own inventory.

**Acceptance criteria**
- [ ] Every vendor route provably guarded — table of route → guard → test
- [ ] Automated cross-tenant test for all vendor endpoints
- [ ] `vendorId` unsettable from client input
- [ ] Zero cross-tenant leakage

---

## Phase 9 — Customer

### M18 — Customer journey completion

**Estimate:** 4–5 h

**Goal**
Close the gaps a real customer hits: reviews tied to real bookings, wishlist persistence, support ticket threads, and notification delivery. `reviews`, `wishlists`, `support_tickets` and `notifications` collections exist with controllers, but frontend integration is thin.

**Files**
- `makemytrip-backend/src/controllers/{review,wishlist,support,notification}Controller.js`
- `makemytrip-backend/src/routes/{engagement,support}.js`
- `makemytrip-frontend/src/pages/{MyTrips,SupportPage,HotelDetailsPage}.jsx`
- `makemytrip-frontend/src/components/` — review form, wishlist toggle, notification bell

**Collections:** `reviews`, `wishlists`, `support_tickets`, `notifications`, `bookings`

**APIs:** `/api/v1/reviews`, `/api/v1/wishlists`, `/api/v1/support`, notifications

**Risks**
- A review must be provably tied to a completed booking or the ratings are worthless — enforce server-side.
- Review text is user-authored and rendered in emails and PDFs; `sanitizeText` must be applied at the boundary (M10 relates).
- Notification volume can become spam without preference controls.

**Test cases**
1. A review cannot be posted for a booking the author does not own.
2. A review cannot be posted for a booking that has not completed.
3. Review text with HTML/script is stored sanitised.
4. Wishlist survives logout/login and is private to its owner.
5. Support ticket thread is visible only to its owner and admins.
6. Aggregate rating on a hotel matches the mean of its published reviews.

**Acceptance criteria**
- [ ] Reviews provably booking-backed
- [ ] All user-authored text sanitised at the boundary
- [ ] Wishlist and support fully wired end to end
- [ ] Owner isolation tested on all four collections

---

### M19 — Non-functional page decision *(business decision)*

**Estimate:** 2 h (removal) — or out of scope (build-out)

**Goal**
Seven pages are shells whose buttons call `alert()` and make **zero API calls**: `CruisePage`, `ForexPage`, `HolidaysPage`, `HomestaysPage`, `InsurancePage`, `ToursPage`, `VisaPage`. They are reachable from the main navigation and look functional to a customer.

> **DECISION REQUIRED FROM YOU.** Three options:
> **(a) Remove from navigation** and keep the code — 2 h, honest, recommended for launch.
> **(b) Mark "Coming soon"** with a waitlist capture — 3 h, keeps SEO surface.
> **(c) Build them out** — each is a full booking vertical (search, inventory, pricing, payment,
> documents). Realistically **15–25 h per vertical**; not a milestone, a project.
>
> **My recommendation: (a) or (b) for launch.** Shipping a travel platform where "Book Cruise"
> pops a JavaScript alert is worse than not offering cruises.

**Files:** the seven pages, `src/App.jsx` routes, `src/components/Common/Header.jsx`, footer nav
**Collections:** none (a/b)
**APIs:** none (a/b)

**Risks:** removing navigation entries may break deep links and existing SEO; use redirects rather than 404s.

**Test cases**
1. No reachable page invokes `alert()` on a primary CTA.
2. Removed routes redirect rather than 404.
3. Navigation contains no dead entries.

**Acceptance criteria**
- [ ] Decision recorded in `CLAUDE.md`
- [ ] No customer-facing route that appears bookable but is not

---

## Phase 10 — UI/UX

### M20 — Native dialog eradication and notification consistency

**Estimate:** 3–4 h

**Goal**
33+ `alert()`, `confirm()` and `prompt()` calls remain across the frontend, contradicting the stated convention ("use the custom toast system instead of browser alerts"). A working `ToastContext` is already mounted in `main.jsx` and unused in most of these places.

**Files**
- `makemytrip-frontend/src/pages/{HomePage,ContactPage,CareersPage,MyTrips,HotelPaymentPage}.jsx`
- `makemytrip-frontend/src/components/{Organisms/HeroSearch,Organisms/AppDownload,Admin/RoomForm,Admin/RichTextEditor}.jsx`
- `makemytrip-frontend/src/utils/pdfDownload.js` (removed in M14)
- `makemytrip-frontend/src/context/ToastContext.jsx`

**Collections:** none
**APIs:** none

**Risks**
- `HomePage` uses `alert()` for date and passenger validation inside a `return alert(...)` expression; naive replacement changes control flow and can let invalid searches through.
- Toasts are non-blocking; validation that previously halted via `confirm()` needs an explicit guard.

**Test cases**
1. Zero `alert(`/`confirm(`/`prompt(` in `src/` (excluding intentional `window.confirm` replaced by dialogs).
2. Past departure date is still rejected — via toast, and the search does not proceed.
3. Infant-vs-adult validation still blocks submission.
4. Every error path surfaces a visible toast.
5. Toasts are dismissible and auto-expire.

**Acceptance criteria**
- [ ] Zero native dialogs in customer-facing code
- [ ] All validation still blocks, not just warns
- [ ] Consistent toast type/duration conventions documented

---

### M21 — Responsive and accessibility baseline

**Estimate:** 4–5 h

**Goal**
Establish a floor: keyboard navigability, focus management in modals, alt text, colour contrast against the DaisyUI theme, and the documented 900/600 px breakpoints applied consistently across the highest-traffic pages.

**Files**
- `makemytrip-frontend/src/pages/{HomePage,SearchResults,HotelListing,Booking,*Payment,*Success}.jsx`
- `makemytrip-frontend/src/components/Common/{Header,Footer,Toast}.jsx`
- `makemytrip-frontend/src/styles/design-tokens.css`

**Collections:** none
**APIs:** none

**Risks**
- 80 existing ESLint warnings include `set-state-in-effect` patterns that can cause focus-management bugs when modals are made accessible.
- Contrast fixes may conflict with the DaisyUI business theme; changes must go through design tokens, not ad-hoc overrides.

**Test cases**
1. Full booking flow completable by keyboard alone.
2. Modals trap focus and restore it on close.
3. All images have meaningful `alt` text.
4. Axe reports zero critical violations on the top 10 pages.
5. Layout intact at 360/600/900/1440 px.
6. No horizontal scroll at any breakpoint.

**Acceptance criteria**
- [ ] Zero critical accessibility violations on the booking path
- [ ] Booking completable via keyboard
- [ ] Breakpoints applied consistently

---

## Phase 11 — Performance

### M22 — Query and payload optimisation

**Estimate:** 3–4 h

**Goal**
Remove the remaining unbounded reads. `getAllBookings` caps at 500 with no pagination; dashboard aggregates scan collections; several controllers fetch whole documents where `.select()` would do. The `findUserByPhone` full-scan was fixed in M1 — find the rest.

**Files**
- `makemytrip-backend/src/controllers/{firebaseBooking,dashboard,adminUser}Controller.js`
- `makemytrip-backend/src/services/{cache/cacheService,reportService}.js`
- `makemytrip-backend/src/config/redis.js`

**Collections:** all high-volume: `bookings`, `users`, `flights`, `hotels`, `audit_logs`

**APIs:** admin listings, dashboard, reports

**Risks**
- Redis is initialised non-blocking and may be absent; cache code must degrade, not fail.
- Adding pagination changes admin UI contracts.
- Aggressive caching on inventory risks selling stale availability — never cache availability counts.

**Test cases**
1. No controller performs an unbounded `.get()` on a growth collection.
2. Admin bookings list paginates correctly past 500.
3. Cache hit/miss behaves correctly with Redis both up and down.
4. Availability is never served from cache.
5. p95 latency measured before/after for the top 10 endpoints.

**Acceptance criteria**
- [ ] Zero unbounded collection reads
- [ ] Cache degrades gracefully without Redis
- [ ] Documented p95 improvement, no regressions

---

### M23 — Frontend bundle and load performance

**Estimate:** 2–3 h

**Goal**
Largest chunks today: `jspdf` 399 kB, `AreaChart` 336 kB, `index` 335 kB, `html2canvas` 200 kB. M14 removes two of these. Address the rest: route-level code splitting is already in place via `React.lazy`, so focus on vendor chunking and lazy-loading the charting library into admin only.

**Files**
- `makemytrip-frontend/vite.config.js`
- `makemytrip-frontend/src/App.jsx`
- `makemytrip-frontend/src/pages/Admin{Dashboard,Reports}.jsx`

**Collections:** none
**APIs:** none

**Risks**
- Over-splitting increases request count and can worsen cold load on mobile.
- Charting must not be pulled into the customer bundle by an incidental shared import.

**Test cases**
1. Customer bundle contains no charting, PDF or canvas library.
2. Admin routes still render charts correctly.
3. Lighthouse performance ≥ 85 on Home and Search.
4. First-load JS for the customer path measured and reduced.

**Acceptance criteria**
- [ ] Customer initial bundle reduced ≥ 40 %
- [ ] Lighthouse ≥ 85 on the two highest-traffic pages
- [ ] No functional regression in admin charts

---

## Phase 12 — Testing

### M24 — HTTP-layer integration suite *(blocked by R3)*

**Estimate:** 4–5 h

**Goal**
`tests/security.test.mjs` (15 tests) and the Playwright specs exist but have never run — the server cannot be started. Get the full pyramid executing: unit (pure functions), integration (controllers, done in M2.5), HTTP (middleware, rate limits, CORS), and E2E (Playwright booking flow).

**Files**
- `makemytrip-backend/tests/{helpers.mjs,security.test.mjs,regression.test.mjs}`
- `makemytrip-backend/tests/http.test.mjs` — new
- `tests/{api/api_checks,booking/flight}.spec.ts`
- `playwright.config.ts`, `makemytrip-backend/package.json`

**Collections:** all (test-tagged documents only)
**APIs:** all

**Risks**
- **Blocked by R2 and R3.** Needs credential rotation and permission to run the server.
- Rate-limit tests interfere with each other and with parallel runs; they need dedicated windows or a resettable store.
- Tests against live Firestore will collide if run concurrently in CI.

**Test cases**
1. All 15 existing security tests pass against a running server.
2. Middleware ordering verified: CORS → headers → body limit → rate limit → auth → RBAC.
3. Rate limiters return 429 with `Retry-After` at their configured thresholds.
4. CORS rejects a non-allowlisted origin.
5. Playwright completes a full flight booking in Razorpay test mode.
6. Suite is idempotent — two consecutive runs both pass.

**Acceptance criteria**
- [ ] `npm run test:all` green end to end
- [ ] Playwright booking flow passes in CI
- [ ] Zero test residue in Firestore after a run
- [ ] Suite completes in < 5 minutes

---

### M25 — CI pipeline completion

**Estimate:** 2–3 h

**Goal**
`.github/workflows/playwright.yml` exists but runs `npm ci` at the repo root — which has no `package.json`. The workflow cannot currently succeed. Build a pipeline that actually gates merges.

**Files**
- `.github/workflows/{ci.yml,playwright.yml,deploy-rules.yml}`
- `makemytrip-backend/package.json`, `makemytrip-frontend/package.json`

**Collections:** none (CI uses a dedicated test project — see M20/R4)
**APIs:** none

**Risks**
- Secrets in CI must come from GitHub secrets, never the repo — this repo has already leaked credentials once.
- A test project is required or CI will write to production data.

**Test cases**
1. Workflow succeeds on a clean checkout.
2. Lint, build, backend tests and E2E all run.
3. A PR with a failing test is blocked from merge.
4. No secret appears in any CI log.

**Acceptance criteria**
- [ ] CI green on `main`
- [ ] Required status checks enforced on PRs
- [ ] Secrets sourced from GitHub secrets only

---

## Phase 13 — Production Readiness

### M26 — Environment separation and secret rotation *(blocked by R2)*

**Estimate:** 3–4 h

**Goal**
Rotate every compromised credential, and split dev/test/production Firebase projects so tests and seeds can never touch customer data. `prodGuard.js` already gates destructive scripts on `TEST_PROJECT_IDS` — give it real projects to name.

**Files**
- `makemytrip-backend/.env.example`, `SECURITY_ROTATION.md`
- `makemytrip-backend/src/config/secrets.js` — refresh fingerprints post-rotation
- `makemytrip-backend/scripts/lib/prodGuard.js`
- `docker-compose.prod.yml`, `deploy/nginx/nginx.conf`

**Collections:** all (project-level separation)
**APIs:** all

**Risks**
- **Requires your provider access** (Razorpay, Google/SMTP, RapidAPI, AviationStack).
- Rotating `JWT_SECRET` invalidates all live sessions and in-flight price quotes — schedule it.
- Data migration between Firebase projects, if production data must be preserved.

**Test cases**
1. Server boots with zero secret-validation errors and no override flag.
2. `ALLOW_COMPROMISED_SECRETS` has no effect when `NODE_ENV=production`.
3. Seed and E2E scripts refuse to run against the production project.
4. Old credentials are confirmed revoked at each provider.

**Acceptance criteria**
- [ ] All five compromised credentials rotated and revoked
- [ ] Server boots clean without any escape hatch
- [ ] Separate dev/test/prod Firebase projects
- [ ] Destructive scripts provably cannot target production

---

### M27 — Observability

**Estimate:** 3–4 h

**Goal**
There are 85 `console.log` calls in backend `src/` and `winston` is a dependency that is barely used. In production, `console.log` is not an observability strategy — there is currently no way to answer "how many bookings failed in the last hour, and why".

**Files**
- `makemytrip-backend/src/services/logger.js` — new, winston-based
- All controllers — replace `console.*` with structured logging
- `makemytrip-backend/src/index.js` — request logging, error reporting
- `docker-compose.prod.yml` — log driver

**Collections:** `audit_logs`
**APIs:** `/health` extended to a real readiness probe

**Risks**
- **Never log tokens, passwords, OTPs or PII** — the security checklist calls this out and several current logs print email addresses. The M1 work already removed some.
- Structured logging changes log format; any existing alerting breaks.

**Test cases**
1. No log line contains a password, token, OTP or full phone number.
2. Errors carry correlation ids traceable across a request.
3. `/health` reports Firestore, Redis and SMTP status.
4. Log volume at expected traffic is within budget.

**Acceptance criteria**
- [ ] Structured logging throughout; zero bare `console.log` in `src/`
- [ ] No sensitive data in logs, verified by automated scan
- [ ] Readiness probe reflects real dependency health

---

### M28 — Deployment and rollback

**Estimate:** 3–4 h

**Goal**
`Dockerfile`s, `docker-compose.prod.yml` and `deploy/nginx/nginx.conf` exist but are untracked and unverified. Prove a deployment works, and prove it can be rolled back.

**Files**
- `makemytrip-backend/Dockerfile`, `makemytrip-frontend/Dockerfile`
- `docker-compose.yml`, `docker-compose.prod.yml`
- `deploy/nginx/nginx.conf`
- `.github/workflows/deploy.yml` — new
- `DEPLOYMENT.md` — new

**Collections:** none
**APIs:** all (behind nginx)

**Risks**
- Nginx must terminate TLS and forward `X-Forwarded-For` correctly, or `applyTrustProxy` mis-buckets every rate limiter — silently disabling brute-force protection.
- `CORS_ORIGIN` must be locked to the production frontend domain.
- No rollback path is a one-way door on the first bad deploy.

**Test cases**
1. `docker compose up` produces a working stack from a clean checkout.
2. `req.ip` resolves to the real client address behind nginx.
3. Rate limiting buckets per real client, not per proxy.
4. HTTPS enforced; HSTS present.
5. CORS rejects any non-production origin.
6. Rollback to the previous image restores service.

**Acceptance criteria**
- [ ] Reproducible deployment from a clean checkout
- [ ] Trust-proxy verified correct end to end
- [ ] Documented, tested rollback
- [ ] Full security checklist in `CLAUDE.md` ticked

---

## Summary

| Phase | Milestones | Hours |
|-------|-----------|-------|
| 0 — Complete | M1, M2, M2.5 | delivered |
| 1 — Data Integrity | M3–M5 | 7–10 |
| 2 — Booking Engine | M6–M8 | 11–16 |
| 3 — Authentication | M9–M10 | 5–7 |
| 4 — Payments | M11–M12 | 7–9 |
| 5 — Email | M13 | 3–4 |
| 6 — PDF | M14 | 2–3 |
| 7 — Admin | M15–M16 | 6–8 |
| 8 — Vendor | M17 | 3–4 |
| 9 — Customer | M18–M19 | 6–7 |
| 10 — UI/UX | M20–M21 | 7–9 |
| 11 — Performance | M22–M23 | 5–7 |
| 12 — Testing | M24–M25 | 6–8 |
| 13 — Production | M26–M28 | 9–12 |
| **Total remaining** | **26 milestones** | **77–104 h** |

### Decisions needed before work resumes

1. **R1** — commit the 122 uncommitted files, or accept the risk.
2. **R2** — rotate the five compromised credentials (blocks M13, M24, M26).
3. **R3** — grant permission to run the server (blocks M24).
4. **M6** — cab inventory model: (a) unlimited, (b) daily capacity *(recommended)*, or (c) physical fleet.
5. **M19** — non-functional pages: (a) remove from nav *(recommended)*, (b) "coming soon", or (c) build out.

### Suggested first three

**M3 → M5 → M4.** M3 and M5 are low-risk and clear the ground; M4 is the highest-risk milestone in
Phase 1 and benefits from having rules, indexes and a clean dependency tree already in place.
