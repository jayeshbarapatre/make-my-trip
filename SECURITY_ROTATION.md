# Credential Rotation Runbook

## Why this exists

`makemytrip-backend/.env.production` was committed to this repository in commit
`7a28d2b` ("Fix login: add .env.production for Vercel…"). It is no longer
tracked and is now gitignored, but **`.gitignore` does not rewrite history** —
the file and every secret in it are still readable by anyone who can run:

```bash
git show 7a28d2b:makemytrip-backend/.env.production
```

Anyone who cloned or forked the repository while that commit was reachable holds
those credentials permanently.

## Status as of 2026-07-31

| Credential | Leaked in `7a28d2b` | Current value in `.env` | Action |
|---|---|---|---|
| `JWT_SECRET` | yes | **already rotated** ✅ | none |
| `SMTP_USER` | yes | **still the leaked value** ❌ | rotate |
| `SMTP_PASS` | yes | **still the leaked value** ❌ | rotate |
| `RAZORPAY_KEY_ID` | yes | **still the leaked value** ❌ | rotate |
| `RAZORPAY_KEY_SECRET` | yes | **still the leaked value** ❌ | rotate |
| `RAPIDAPI_KEY` | yes | **already rotated** ✅ (see note) | delete the stale duplicate |
| `AVIATIONSTACK_API_KEY` | yes | **still the leaked value** ❌ | rotate |
| `DATABASE_URL` (Supabase) | yes | not used — Firestore is the DB | revoke at provider |
| `FIREBASE_PRIVATE_KEY` | no | not leaked | none |

> **Note on `RAPIDAPI_KEY`.** It appears **twice** in `.env` — line 25 holds the
> leaked value, line 42 holds a rotated one. `dotenv` keeps the **last**
> occurrence, so the value actually loaded is the rotated one and the key is not
> compromised at runtime. Delete line 25: leaving a dead leaked secret in the
> file invites someone to "fix the duplicate" by keeping the wrong one.

Verify status at any time by asking the running validator, which checks the
values as `dotenv` actually resolves them:

```bash
cd makemytrip-backend
node -e "import('dotenv/config').then(()=>import('./src/config/secrets.js')).then(m=>{
  const r=m.inspectSecrets({isProduction:false});
  r.errors.forEach(e=>console.log('LEAKED/INVALID:',e));
  console.log(r.errors.length?'':'All secrets clean');
})"
```

## Enforcement

`src/config/secrets.js` fingerprints every secret-bearing variable with SHA-256
and compares it against the published values. **The server will not start** while
a leaked credential is in use:

```
❌ Startup aborted — secret validation failed:

   • RAZORPAY_KEY_SECRET matches the RAZORPAY_KEY_SECRET value published in
     commit 7a28d2b and is compromised. Regenerate it at the provider —
     see SECURITY_ROTATION.md.
```

Only variable *names* are ever printed. No secret value, prefix, or length
reaches the logs.

---

# Rotation procedure

Each step below must be performed by a human in the provider's console. None of
it can be automated from this repository, because each requires an authenticated
session with the provider.

## 1. Razorpay (payments + refunds) — highest impact

Live keys can create charges and issue refunds against your settlement account.

1. Sign in at <https://dashboard.razorpay.com>.
2. **Settings → API Keys**.
3. Click **Regenerate Live Key** (or **Regenerate Test Key** for the test pair).
   Razorpay shows `key_secret` exactly once — copy it immediately.
4. Update `makemytrip-backend/.env`:
   ```
   RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   RAZORPAY_KEY_SECRET=<the secret shown once>
   ```
5. Update the **frontend publishable key** in `makemytrip-frontend/.env.production`:
   ```
   VITE_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
   ```
   This one is public by design — Vite inlines `VITE_*` into the browser bundle.
   Only the *ID* belongs here. The **secret must never** appear in a `VITE_*`
   variable.
6. Rebuild the frontend so the new ID reaches the bundle: `npm run build`.
7. In the Razorpay dashboard, review **Transactions** for any charge you do not
   recognise since the leak.

**Blast radius while rotating:** in-flight checkouts fail signature verification
and return `Invalid payment signature`. No booking is created without a verified
payment, so no phantom bookings result. Rotate during a low-traffic window.

## 2. Gmail SMTP (all transactional email)

The leaked `SMTP_PASS` is a Google App Password — it grants SMTP send rights as
that mailbox and can be used to send mail impersonating your brand.

1. Sign in to the Google account in `SMTP_USER`.
2. Go to <https://myaccount.google.com/apppasswords>.
3. **Revoke** the existing app password.
4. Create a new one (16 characters, spaces removed).
5. Update `.env`:
   ```
   SMTP_USER=<mailbox>
   SMTP_PASS=<new 16-char app password>
   ```
6. Also rotate the account password and check
   <https://myaccount.google.com/security-checkup> for unknown sessions.

Consider moving off Gmail entirely — see "Follow-up" below.

**Blast radius:** none. `mailer.js` builds its transport lazily and
`verifyConnection()` reports SMTP health at boot, so a bad password is visible
immediately in the startup log.

## 3. RapidAPI

Used by `src/config/rapidApiClients.js` for the `/api/v1/search/*` endpoints.
A leaked key lets a third party spend your metered quota.

1. Sign in at <https://rapidapi.com/developer/apps>.
2. Select the application → **Security** → **Regenerate** the API key.
3. Update `RAPIDAPI_KEY` in `.env` (it currently appears **twice** in the file —
   remove the duplicate; `dotenv` silently keeps the last occurrence).
4. Review the usage/billing dashboard for unexpected consumption.

## 4. Aviationstack

`AVIATIONSTACK_API_KEY` is set in `.env` but read by no source file. Rotate it
anyway, then delete the variable:

1. <https://aviationstack.com/dashboard> → reset the access key.
2. Remove the line from `.env`.

## 5. Supabase / Postgres

`DATABASE_URL` leaked a live Supabase connection string. Firestore is now the
only database, so no replacement value is needed — but the exposed database may
still exist.

1. Sign in at <https://supabase.com/dashboard>.
2. **Project Settings → Database → Reset database password.**
3. If the project is no longer used, delete it outright.

## 6. Purge the secret from git history (optional, recommended)

Rotation alone is sufficient — once every leaked value is dead, the history is
harmless. Removing it as well prevents the values being mistaken for live ones
later.

```bash
# Requires: pip install git-filter-repo
cd h:/make-my-trip-practical
git filter-repo --path makemytrip-backend/.env.production --invert-paths
git push --force-with-lease origin --all
```

> **This rewrites every commit hash.** Every collaborator must re-clone. Do not
> run it without agreement from everyone with a working copy, and take a full
> backup of the repository first:
> `git clone --mirror . ../mmt-backup.git`

---

# New self-issued secrets

`JWT_SECRET` and `OTP_PEPPER` are issued by this application rather than a
provider, so they can be generated locally:

```bash
node -e "console.log('JWT_SECRET='+require('crypto').randomBytes(48).toString('base64url'))"
node -e "console.log('OTP_PEPPER='+require('crypto').randomBytes(32).toString('base64url'))"
```

`JWT_SECRET` is already rotated. Setting a dedicated `OTP_PEPPER` is recommended
so that a future `JWT_SECRET` rotation does not invalidate every live OTP —
`otpService.js` falls back to `JWT_SECRET` when the pepper is unset.

---

# Verification

After rotating, confirm each subsystem still works:

```bash
cd makemytrip-backend && npm run dev
```

Expect in the startup log:

```
🔐 Secret validation passed (0 warnings)
✅ Firestore database connected
📧 SMTP ready — <user> via smtp.gmail.com
✅ Server listening on http://localhost:5000
```

Then exercise the paths that depend on the rotated credentials:

| Credential | Verification |
|---|---|
| `JWT_SECRET` | Log in; confirm a token is returned and `GET /api/v1/auth/profile` accepts it |
| `SMTP_*` | Register a new user; confirm the welcome email arrives |
| `RAZORPAY_*` | Complete a test booking end to end through `/payment/quote` → `/create-order` → `/verify` |
| `RAPIDAPI_KEY` | `GET /api/v1/search/flights?from=DEL&to=BOM&date=2026-08-01` returns non-mock results |

A failed secret check aborts startup before any port is opened, so a bad
rotation cannot half-start the service.

---

# Follow-up (not part of this task)

- Move secrets out of `.env` files into a managed store (AWS Secrets Manager,
  Google Secret Manager, Doppler) with automatic rotation.
- Replace Gmail SMTP with a transactional provider (SES, SendGrid, Postmark).
  Gmail imposes a ~500 recipients/day cap that will not survive launch volume.
- Add secret scanning to CI (`gitleaks`, or GitHub push protection) so a future
  `.env` commit is blocked at push time rather than found in an audit.
