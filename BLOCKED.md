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
| Cab inventory model | (a) unlimited (b) daily capacity per route+class (c) physical fleet | **(b)** — prevents overselling without inventing fleet management |
| Seven non-functional pages (Cruise, Forex, Holidays, Homestays, Insurance, Tours, Visa) | (a) remove from nav (b) "coming soon" (c) build out (15–25 h each) | **(a) or (b)** for launch |
| Mobile OTP | Twilio is unconfigured, so `/auth/send-otp` returns 503 | Ship on email sign-in, or provision Twilio |
| Redis | Unreachable, so rate limiters and cache fall back to in-memory | Fine at one instance (`render.yaml` starter plan). Provision Redis **before** scaling out, or per-instance limits multiply |
