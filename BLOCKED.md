# Blocked Tasks — External Dependencies Only

Single source of truth for work that cannot proceed without something outside the
codebase. Everything here is **implemented and staged**; only execution is blocked.

Internal work never waits on this list.

**Last reconciled against reality: 2026-08-07.** Every status below was re-checked
against the live deployment or the running code on that date, not carried forward
from the previous revision. Three entries were wrong and are corrected in place.

---

## B1 — Firestore quota

| | |
|---|---|
| **Reason** | The Spark free tier's daily read quota is exhausted faster than a day. Every read and write then fails with `8 RESOURCE_EXHAUSTED`, which surfaces as 500s across search, sign-in, OTP and error reporting |
| **Dependency** | Blaze plan with a budget cap (~2 min, effectively ₹0 — Blaze includes the same free allowance and only bills past it) |
| **Status 2026-08-07** | Currently healthy. Not resolved |

> **Corrected 2026-08-07.** The previous revision said the root cause was fixed —
> that search once read ~1,596 documents per cross-vertical page and now reads a
> handful, so "the quota was consumed by the old scan, not by ongoing use". That
> claim did not survive contact with the day. On 2026-08-06 the quota was
> exhausted twice, the second time **within four hours of the daily reset**, with
> no meaningful traffic. Something is still consuming it and has not been
> identified. The Firebase console usage breakdown is the way to find out; two
> candidates worth checking first are `AdminApiHealth.jsx`, which polls every
> 5 seconds while the tab is open, and the CI job that runs 175 Firestore-backed
> tests on every push and pull request.
>
> The background `npm run bootstrap -- --apply --wait 10800` poller that this
> entry claimed was "already running" belonged to an earlier session's shell. It
> is not running. `seed:coverage` has still not been applied, which is why
> Mumbai → Chennai and Delhi → Pune return no flights on any date.

---

## B2 — SMTP delivery

| | |
|---|---|
| **Reason** | `SMTP_USER` / `SMTP_PASS` are among five credentials published in commit `7a28d2b`. The provider rejects them outright: the server logs `535-5.7.8 Username and Password not accepted` at boot and **no transactional email is delivered** — booking confirmations included |
| **Dependency** | Credential rotation at the provider (see `SECURITY_ROTATION.md`), or a move to Resend/Brevo — same `SMTP_*` variables, no code change |
| **Completed** | Template rendering is exercised and asserted by `verify:booking`, so a broken template is caught. Email logging, retry and the admin resend path are implemented |
| **Status 2026-08-07** | Unchanged, and **parked by decision**. Reproduced live again during `verify:payment`: a confirmed booking sent no mail |

> Corrected 2026-08-05: an earlier revision said the secret guard refuses to
> boot. It does not — `SMTP_*` is feature-gated, so the server starts and email
> fails silently per-send. That is the more dangerous failure mode and the reason
> this is a launch blocker rather than a nuisance.
>
> Note for testing: `jayeshbarapatre4923@gmail.com` was over its Google storage
> quota and cannot *receive*. Test against `dev646795@gmail.com` or another inbox,
> or a working configuration will still look broken.

---

## ~~B2a — Razorpay webhook secret~~ — RESOLVED 2026-08-07

`RAZORPAY_WEBHOOK_SECRET` **is** set on the deployed API. Verified by posting an
unsigned body to `POST /api/v1/payment/webhook` and getting `400 Missing
signature`; an unset secret returns `503 Webhook not configured` before the
signature is ever examined.

Also verified, and worth recording because it was suspected and is not true:
**`express.raw` delivers a real Buffer on Vercel.** A bogus signature is refused
with `400 Invalid webhook signature`, not the `500 Webhook misconfigured` that a
pre-parsed body would produce. The platform's body handling does not break the
HMAC.

What remains is not a blocker, it is one confirmation: send a test delivery from
the Razorpay dashboard and check it reports 2xx. See launch gate 2b.

---

## ~~B3 — Browser tests~~ — RESOLVED 2026-08-07

Playwright now runs. 16/16 pass across Chromium and a Pixel 7 viewport.

> **Corrected 2026-08-07.** This entry claimed `.github/workflows/playwright.yml`
> "runs the specs on push and PR". It did not, and never had. The workflow ran
> `npm ci` at the repository root, which has no `package.json`, so every run
> failed at the install step — and because it always failed there, nobody noticed
> that the specs underneath were written against markup that does not exist in
> this app (`.flight-list`, `input[placeholder="From"]`, inline card fields, when
> payment goes through Razorpay's hosted widget) with a baseURL of `:3000` when
> the app serves on `:5173`. They could not have passed.
>
> Replaced with eight specs over routes that render from bundled data, so the job
> needs no API, no Firestore and no credentials — a gate that depends on the
> datastore fails whenever B1 does, and a flaky gate gets ignored rather than
> fixed. Config and specs moved into `makemytrip-frontend`, where
> `@playwright/test` is actually a dependency.

---

## B4 — Firestore rules and index deployment

| | |
|---|---|
| **Reason** | `firebase deploy` needs authenticated Firebase CLI access |
| **Dependency** | `FIREBASE_SERVICE_ACCOUNT` (the whole service-account JSON) and `FIREBASE_PROJECT_ID` as GitHub repository secrets |
| **Completed** | `firebase.json`, `firestore.rules` (deny-all, verified safe), `firestore.indexes.json` (18 composites, 9 field overrides), and `.github/workflows/firestore-rules.yml`, which validates on PR and deploys on main |
| **Auto-executes** | The workflow deploys on the next merge to `main` once the secrets exist |
| **Status 2026-08-07** | Unchanged. Works on the free Spark plan; does not depend on B1 |

---

## B5 — Business decisions

| Decision | Status |
|---|---|
| ~~Cab inventory model~~ | **Reopened 2026-08-05** in `0dca37b`. Cabs are a real vertical again: a cab document is one vehicle with one driver and one plate, booked per travel date, with `dailyCapacity` (default 1) and membership of `ALWAYS_DATED`. `DEFAULT_UNSELLABLE` is now empty — nothing is closed |
| ~~Seven non-functional pages~~ | **Decided 2026-08-05: gated.** Cruise, Forex, Visa, Insurance, Tours, Homestays and Holidays each carry a `<ComingSoon>` banner; every placeholder CTA says plainly that nothing has been charged or reserved. `tests/search.test.mjs` pins it |
| Mobile OTP | Twilio unconfigured, so `/auth/send-otp` returns 503. Confirmed live: `/auth/otp-status` reports `sms.available: false`. Email OTP works. Ship on email sign-in, or provision Twilio |
| Redis | **Changed 2026-08-06** in `4dd133d`: migrated from ioredis to the Upstash REST client, which works on serverless. `UPSTASH_REDIS_REST_URL` / `_TOKEN` are set. Without them the limiters fall back to in-memory, which on Vercel means one bucket per lambda — the effective brute-force limit multiplies by however many instances are warm |

---

## Launch gates

**Target (stated 2026-08-05):** a real application — real Firestore, real SMTP,
real user accounts, real booking records, real PDFs, real booking flow — with
**dummy travel inventory** and **test-mode payments** instead of live providers.

That scopes two things *out*: live Razorpay (KYC, real money settling) and live
inventory providers (Amadeus/GDS). It scopes SMTP firmly *in* — "real SMTP" means
a confirmation email has to actually arrive.

Completion is not declared by writing a document. Each gate needs evidence.

| # | Gate | Status |
|---|---|---|
| 1 | A real confirmation email arrives | **BLOCKER** — `535-5.7.8`, reproduced by `verify:payment` on 2026-08-07. Parked by decision |
| 2a | The chain works against the real gateway, test mode | **Done** — `npm run verify:payment -- --local-webhook-secret`, 29/29. A real order exists at api.razorpay.com holding exactly the amount the server priced |
| 2b | Razorpay can **deliver** a webhook to us | **Open, ~5 min** — the secret and a public URL both exist now (see B2a). All that is left is one test delivery from the dashboard, confirmed 2xx |
| 3 | Firestore indexes deployed | **Open** — needs the B4 secrets. Free on Spark |
| 4 | Production errors captured somewhere queryable | **Done** — `errorReports`, verified end to end with redaction against real Firestore. It earned its keep this week: the `/cab/payment` crash was diagnosed from a captured stack rather than by guessing |
| 5 | Cabs do not oversell | **Done** — not by closing the vertical, as the previous revision recorded, but by giving cabs dated per-vehicle capacity in `0dca37b` |
| 6 | A merge cannot ship an obviously broken frontend | **Done 2026-08-07** — 25 unit/component tests and 8 browser specs, both gating CI, each verified non-vacuous by reintroducing the defect it pins |

**Out of scope by decision:** live Razorpay keys, live inventory providers.

> **Corrected 2026-08-07.** Firestore Blaze was previously listed as out of scope,
> on the grounds that Spark's 50k reads/day is ample for dummy inventory. B1
> shows that it is not. Blaze is now a dependency, not an exclusion.

---

## What this list does not cover

Two things are wrong with the product that no external dependency is blocking,
so they belong in `PRODUCTION_ROADMAP.md` rather than here — recorded so they are
not mistaken for blocked work:

- **Nothing proves a booking can be completed.** The browser specs deliberately
  avoid the API so they cannot flake on B1. That leaves the one journey the
  product exists for untested end to end.
- **Responsive behaviour is unverified by eye.** Every UI change this week was
  checked by lint, build and static analysis. Two visual regressions still
  reached the deployed site and were caught by a human looking at it.
