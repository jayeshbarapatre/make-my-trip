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

## B2 — SMTP delivery verification

| | |
|---|---|
| **Reason** | `SMTP_USER` / `SMTP_PASS` are among five credentials published in commit `7a28d2b`; the server's secret guard refuses to boot with them |
| **Dependency** | Credential rotation at the provider (see `SECURITY_ROTATION.md`) |
| **Completed** | Template rendering is exercised and asserted by `verify:booking`, so a broken template is caught. Email logging, retry and the admin resend path are implemented |
| **Auto-executes** | Once rotated, `verify:booking` asserts real delivery instead of render-only |

---

## B3 — HTTP-layer and browser tests

| | |
|---|---|
| **Reason** | Cannot start `node src/index.js` (permission), and there is no browser in this environment |
| **Dependency** | A Bash permission rule for the server command, plus B2 (the server will not boot until credentials rotate) |
| **Completed** | `tests/security.test.mjs` (15 tests) and the Playwright specs exist and are wired to `npm run test:all` |
| **Auto-executes** | `npm run test:all` covers middleware ordering, rate limiters and CORS; Playwright drives the booking flow |

> This is also why screenshots cannot be produced. `verify:search` and
> `verify:booking` print real per-route, per-stage execution output instead.

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
| ~140 uncommitted files | commit / accept risk | Commit — this is the largest single risk to the project |
