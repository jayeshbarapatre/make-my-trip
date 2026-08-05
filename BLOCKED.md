# Blocked Tasks — External Dependencies Only

Single source of truth for work that cannot proceed without something outside the
codebase. Everything here is **implemented and staged**; only execution is blocked.

Internal work never waits on this list.

---

## B1 — Live inventory bootstrap

| | |
|---|---|
| **Reason** | Firestore free-tier daily read quota exhausted |
| **Dependency** | Quota reset (midnight US/Pacific) **or** Blaze plan **or** a second Firebase project |
| **Completed** | `migrate:route-index`, `seed:coverage` (36 routes × 2 directions × 5 categories), `verify:search`, `verify:booking` — all written, syntax-clean, dependencies resolve |
| **Auto-executes** | `npm run bootstrap -- --apply --wait 10800` is **already running in the background**, polling. On quota reset it runs timestamps → route-index → coverage seed → search verification → booking verification, in order, stopping at the first failure so data is never half-applied |

> Root cause is fixed: search read ~1,596 documents per cross-vertical page and now
> reads a handful. The quota was consumed by the old scan, not by ongoing use.

---

## B2 — SMTP delivery

| | |
|---|---|
| **Reason** | `SMTP_USER` / `SMTP_PASS` are among five credentials published in commit `7a28d2b`. The provider now rejects them outright: the server logs `535-5.7.8 Username and Password not accepted` at boot and **no transactional email is delivered** — booking confirmations included |
| **Dependency** | Credential rotation at the provider (see `SECURITY_ROTATION.md`) |
| **Completed** | Template rendering is exercised and asserted by `verify:booking`, so a broken template is caught. Email logging, retry and the admin resend path are implemented |
| **Auto-executes** | Once rotated, `verify:booking` asserts real delivery instead of render-only |

> Corrected 2026-08-05: an earlier revision of this entry said the secret guard
> refuses to boot. It does not — `SMTP_*` is feature-gated, so the server starts
> and email fails silently per-send. That is the more dangerous failure mode and
> the reason this is still a launch blocker.

---

## B2a — Razorpay webhook secret

| | |
|---|---|
| **Reason** | `RAZORPAY_WEBHOOK_SECRET` is unset, so `POST /payment/webhook` returns 503 to every delivery — the abandoned-checkout hole it exists to close stays open |
| **Dependency** | Razorpay Dashboard → Settings → Webhooks: create the endpoint, subscribe to `payment.captured` and `payment.failed`, copy the signing secret (**not** the API key secret) |
| **Completed** | Handler, signature verification, idempotency and 15 tests (`npm run test:webhook`, `npm run test:quote`). Listed in `.env.example` and `render.yaml` |
| **Guard** | Now on the `FEATURE_GATED` list in `src/config/secrets.js`, so production startup aborts rather than running with the hole open |

---

## B3 — Browser tests

| | |
|---|---|
| **Reason** | No browser in this environment, so the Playwright specs cannot be driven locally |
| **Dependency** | CI, or a local browser install |
| **Completed** | `.github/workflows/playwright.yml` runs the specs on push and PR |

> Corrected 2026-08-05: this entry also claimed the server cannot be started and
> that `tests/security.test.mjs` therefore could not run. Both are resolved — the
> server starts, and the security suite passes 15/15 against it. It now runs in
> CI via `.github/workflows/tests.yml`.

---

## B4 — Firestore rules and index deployment

| | |
|---|---|
| **Reason** | `firebase deploy` needs authenticated Firebase CLI access |
| **Dependency** | `FIREBASE_SERVICE_ACCOUNT` and `FIREBASE_PROJECT_ID` as repository secrets |
| **Completed** | `firebase.json`, `firestore.rules` (deny-all, verified safe), `firestore.indexes.json` (18 composites, 9 field overrides), and `.github/workflows/firestore-rules.yml` which validates on PR and deploys on main |
| **Auto-executes** | The workflow deploys on the next merge to `main` once the secrets exist |

---

## B5 — Business decisions

| Decision | Options | Recommendation |
|---|---|---|
| ~~Cab inventory model~~ | **Decided 2026-08-05: cabs are closed.** They reserved nothing, so every one sold was a promise with no vehicle behind it. `quoteTrip` refuses the vertical (`UNSELLABLE_TYPES`), the tab and footer link are gone, and `CabsPage` carries a coming-soon banner. Reopen with option (b) — daily capacity per route+class | — |
| ~~Seven non-functional pages~~ | **Decided 2026-08-05: gated.** Each carries a `<ComingSoon>` banner; every placeholder CTA now says plainly that nothing has been charged or reserved | — |
| Mobile OTP | Twilio is unconfigured, so `/auth/send-otp` returns 503 | Ship on email sign-in, or provision Twilio |
| Redis | Unreachable, so rate limiters and cache fall back to in-memory | Fine at one instance (`render.yaml` starter plan). Provision Redis **before** scaling out, or per-instance limits multiply |

---

## Launch gates

**Target (stated 2026-08-05):** a real application — real Firestore, real SMTP,
real user accounts, real booking records, real PDFs, real booking flow — with
**dummy travel inventory** and **test-mode payments** instead of live providers.

That scopes two things *out*: live Razorpay (KYC, real money settling) and live
inventory providers (Amadeus/GDS). It scopes SMTP firmly *in* — "real SMTP"
means a confirmation email has to actually arrive.

Completion is not declared by writing a document. Each gate needs evidence.

| # | Gate | Status |
|---|---|---|
| 1 | A real confirmation email arrives | **BLOCKER** — the only one left. `535-5.7.8` from Gmail; reproduced live by `verify:payment`. Rotate the app password (~5 min), or move to Resend/Brevo — same `SMTP_*` vars, no code change |
| 2a | The chain works against the real gateway, test mode | **Done** — `npm run verify:payment -- --local-webhook-secret`, 29/29. A real order exists at api.razorpay.com holding exactly the amount the server priced |
| 2b | Razorpay can **deliver** a webhook to us | **Open, ~10 min, free** — `RAZORPAY_WEBHOOK_SECRET` from the dashboard plus a public URL (`cloudflared tunnel --url http://localhost:5000`, or deploy first). Needed in test mode too: a closed tab loses a booking regardless of payment mode |
| 3 | Firestore indexes deployed | **Open** — `firebase deploy --only firestore:indexes`, or the service-account secret the `firestore-rules.yml` workflow already expects. Works on the free Spark plan |
| 4 | Production errors captured somewhere queryable | **Done** — `errorReports`, verified end-to-end with redaction against real Firestore |
| 5 | Cabs do not oversell | **Done** by closing the vertical. Worth revisiting: see below |

**Out of scope by decision:** live Razorpay keys, live inventory providers,
Firestore Blaze (Spark's 50k reads/day is ample for dummy inventory, especially
after the search fix took a cross-vertical page from ~1,596 reads to a handful).

### Open question — cabs

Cabs were closed because they reserve no inventory. With inventory dummy across
*every* vertical, that is a data-integrity bug rather than a customer-harm one:
no flight or hotel booking produces a real trip either. Two ways forward:

- **Give cabs a daily capacity model** per route and class, joining `DATED_TYPES`
  and `RESOURCE_COLLECTIONS` like buses and trains. Then cabs sell correctly and
  the vertical reopens. This is BLOCKED.md B5 option (b), and is bounded work.
- **Reopen as-is** (`UNSELLABLE_TYPES=`) and accept that cabs oversell until
  inventory becomes real.

The first is the right answer if cabs are meant to be part of the product.
