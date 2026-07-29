# Email & OTP

Transactional email and OTP for the MakeMyTrip backend. Everything below sends
through real providers — there are no simulated sends and no hardcoded codes.

There are **no development fallbacks**. Every channel either delivers through a
real provider or returns an explicit error — nothing simulates, redirects, or
short-circuits delivery, and no environment variable can bypass rate limiting.

## Quick check

```bash
npm run test:email                                  # send all 9 templates to SMTP_USER
npm run test:email -- you@example.com               # …to a different address
npm run test:email -- you@example.com --sms +919876543210
npm run test:otp                                    # OTP lifecycle across 6 numbers
npm run preview:email                               # render templates to preview/ without sending
```

`test:otp` needs a running server. The per-IP limiter counts every OTP call, so
run the functional cases with a widened limit and assert the limiter separately:

```bash
RATE_LIMIT_OTP_MAX=200 PORT=5055 npm start          # terminal 1
API_BASE=http://localhost:5055/api/v1 RATE_LIMIT_OTP_MAX=200 npm run test:otp

PORT=5055 npm start                                 # terminal 1, production defaults
API_BASE=http://localhost:5055/api/v1 RATE_LIMIT_ONLY=1 npm run test:otp
```

The suite issues codes through `otpService` and submits them to the real
`/auth/verify-otp` endpoint over HTTP. The server grants the test no special
access — there is no test-only verification path.

The server prints its delivery readiness at boot:

```
📧 SMTP ready — you@gmail.com via smtp.gmail.com
📲 SMS ready — provider: twilio
```

A `⚠️ … NOT READY` line means that channel will return an error rather than a
false success. `GET /api/v1/auth/otp-status` reports the same thing as JSON.

---

## SMTP setup (Gmail)

1. Enable 2-Step Verification on the Google account.
2. Create an App Password at <https://myaccount.google.com/apppasswords>.
3. Fill in `.env`:

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=<16-character app password>
SMTP_FROM_NAME=MakeMyTrip
SMTP_FROM_EMAIL=you@gmail.com
```

`SMTP_FROM_EMAIL` must be the authenticated address or a verified Gmail alias.
Setting it to a domain you don't control makes Gmail rewrite the header and
pushes your mail to spam through SPF/DKIM misalignment.

Gmail's free tier allows roughly 500 recipients/day. For production, move to a
dedicated sender (SES, SendGrid, Postmark) — only the four `SMTP_*` values change.

There is no demo/redirect mode. Mail always goes to the real recipient, so a
misconfiguration surfaces as a delivery error instead of silently landing in
someone else's inbox.

---

## SMS setup (Twilio)

```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx
```

Get all three from <https://console.twilio.com>. On a **trial** account you must
also verify each destination number under *Phone Numbers → Verified Caller IDs*,
otherwise Twilio rejects the send with error 21608.

Without those three values `/auth/send-otp` returns **503 `SMS_NOT_CONFIGURED`**.
There is no console or simulated driver — mobile OTP is either really delivered
or it fails loudly.

### Using a different provider

`src/services/sms/smsService.js` exposes one `sendSms(phone, body)` interface.
Add a driver function and a `case` in `sendSms`; nothing else changes.
Note that Indian providers (MSG91, Fast2SMS) require TRAI DLT registration of
your sender ID and message template before any SMS is delivered.

---

## OTP policy

| Setting | Env var | Default |
|---|---|---|
| Code length | — | 6 digits |
| Lifetime | `OTP_TTL_MINUTES` | 5 min |
| Wrong-code attempts | `OTP_MAX_ATTEMPTS` | 5 |
| Resend cooldown | `OTP_RESEND_COOLDOWN_SECONDS` | 30 s |
| Sends per hour | `OTP_MAX_SENDS_PER_HOUR` | 5 |

Properties enforced by `src/services/otpService.js`:

- Codes come from `crypto.randomInt`, never `Math.random`.
- Only a salted SHA-256 hash is stored (`OTP_PEPPER`, falling back to `JWT_SECRET`).
  A Firestore export cannot be replayed.
- Comparison is constant-time.
- Verification consumes the code inside a Firestore transaction, so a code
  works exactly once even under concurrent requests.
- If delivery fails, the issued code is deleted — a live code never outlives a
  failed send.
- Codes are never written to an email log or returned in an API response.

On top of that, `express-rate-limit` guards the routes per IP: `authLimiter`
on register, login and reset; `otpLimiter` on every send, resend and verify
endpoint. Both default to 5 requests / 15 min and are tunable via
`RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW_MS`, `RATE_LIMIT_OTP_MAX`,
`RATE_LIMIT_OTP_WINDOW_MS`.

The limiters have no `NODE_ENV` escape hatch. Widening a limit for a test run
requires setting that limit explicitly; no single env value switches
brute-force protection off.

---

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Create account → welcome email |
| POST | `/auth/login` | Password login |
| POST | `/auth/send-otp` | Mobile OTP over SMS |
| POST | `/auth/resend-otp` | Resend (cooldown applies) |
| POST | `/auth/send-email-otp` | Passwordless email OTP |
| POST | `/auth/resend-email-otp` | Resend |
| POST | `/auth/verify-otp` | Verify mobile or email OTP → JWT |
| POST | `/auth/forgot-password` | Email a reset code |
| POST | `/auth/reset-password` | Consume the code, set new password |
| GET | `/auth/otp-status` | Which channels are live + OTP policy |

### Error codes returned by verify

`OTP_NOT_FOUND` · `OTP_EXPIRED` · `OTP_ALREADY_USED` · `OTP_TOO_MANY_ATTEMPTS` ·
`OTP_INVALID` (carries `attemptsRemaining`)

Send returns `OTP_COOLDOWN` / `OTP_THROTTLED` with `retryAfter` seconds, and
`SMS_NOT_CONFIGURED` (503) or `SMS_DELIVERY_FAILED` (502) when delivery fails.

---

## Templates

Built in code under `src/services/email/templates/`:

| Template | Trigger |
|---|---|
| `booking.js` | Booking confirmed — flight, hotel, train, bus, cab |
| `account.js` → `renderWelcome` | Registration |
| `account.js` → `renderOtp` | Login / signup / password-reset codes |

`layout.js` holds the shared shell and building blocks (`card`, `row`,
`journeyStrip`, `travellerTable`, `fareTable`, `button`). Templates are
table-based with inline CSS, a hidden preheader, and a plain-text alternative —
they render in Gmail, Outlook and Apple Mail.

Booking payloads arrive from five frontend pages with inconsistent field names,
so `normalise()` in `booking.js` reads through alias lists rather than fixed keys.
Add new aliases there rather than at the call sites.

### Logo

Set `BRAND_LOGO_URL` to a publicly reachable image and the templates use it.
Left empty, they fall back to an image-free wordmark that still renders when a
client blocks remote images. A `localhost` URL will not load in a real inbox.

---

## Delivery logs

Every send writes to the Firestore `emailLogs` collection: type, recipient,
subject, status (`queued` → `sending` → `sent`/`failed`), attempt count, SMTP
response and provider message ID. Visible through the admin email-log endpoints.

OTP codes are deliberately excluded from the payload snapshot, which is why an
OTP email cannot be resent from a log — only booking confirmations can.

---

## Notes

- Sending is direct via nodemailer with a pooled connection and up to
  `EMAIL_MAX_ATTEMPTS` (default 3) retries on transient transport errors only.
  There is no Redis or worker process to run.
- Booking confirmations are fire-and-forget: a mail outage logs a warning and
  never fails the booking or the payment.
- `emailTemplateAdminController` still offers Prisma-backed template CRUD from
  the admin panel, but the send path no longer reads those rows — templates come
  from code. Treat that screen as inactive until it is either removed or rewired.
