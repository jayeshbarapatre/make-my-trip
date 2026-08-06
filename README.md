# MakeMyTrip — full-stack travel booking platform

React 18 + Vite frontend, Node/Express + Firestore backend. Five verticals book
end to end — flights, hotels, buses, trains and cabs — with server-side pricing,
Razorpay checkout, atomic inventory reservation, PDF tickets and invoices, plus
an admin console and a vendor portal.

> **Demonstration mode.** Accounts, authentication, database writes, emails, PDFs
> and the booking workflow are real. Travel inventory is seeded and payments run
> in Razorpay test mode — no seat, room or vehicle is held with any operator.
> The notice appears in the footer, on checkout, and on every ticket and email.
> See `src/config/demoMode.js` and `VITE_DEMO_MODE`.

## Live

| | |
|---|---|
| Frontend | https://make-my-trip-web.vercel.app |
| API | https://make-my-trip-api-roan.vercel.app |

## Run it

```bash
# API — needs makemytrip-backend/.env (see .env.example)
cd makemytrip-backend && npm install && npm run dev      # :5000

# Web — needs makemytrip-frontend/.env.local
cd makemytrip-frontend && npm install && npm run dev     # :5173
```

## Test it

```bash
# Frontend — unit and component, no browser or datastore needed. Gates CI.
cd makemytrip-frontend && npm test
cd makemytrip-frontend && npm run test:e2e     # Playwright; needs a browser

# Backend
cd makemytrip-backend && npm run test:mocked   # offline, module-mocked
cd makemytrip-backend && npm test              # hits real Firestore
cd makemytrip-backend && npm run verify:payment -- --local-webhook-secret
```

`verify:payment` runs the whole chain against the real Razorpay test gateway:
order creation, signature verification, webhook idempotency and quote binding.

## Where things are

| Path | |
|---|---|
| `makemytrip-frontend/` | React SPA — 75 route-split pages |
| `makemytrip-backend/` | Express API, Firestore-only |
| `CLAUDE.md` | **Start here.** Architecture, conventions and the rules that are not obvious from the code |
| `BLOCKED.md` | What is blocked, on what, and what has already been done about it |
| `PRODUCTION_ROADMAP.md` | Remaining milestones, sequenced with acceptance criteria |
| `SECURITY_ROTATION.md` | Credential rotation runbook |
| `DESIGN_SYSTEM.md` | Tokens and component conventions |
| `docs/archive/` | Historical build notes — point-in-time, not maintained |

## The rules worth knowing before you change anything

- **Firestore is the only database.** No Mongoose, Prisma or Postgres. Do not
  reintroduce them.
- **Prices are calculated server-side only,** in `pricingService.js`. The client
  renders the quote it is given and never computes a total.
- **A booking requires a captured, caller-owned payment,** and must match the
  quote it was paid for. `createBookingForPayment()` is the only function that
  writes a booking.
- **Inventory is reserved in the same transaction as the booking,** so there is
  never a seat without a booking or a booking without a seat.
- **Buttons take `.btn` plus a colour modifier.** `.btn-primary` alone is colour
  with no geometry.
- **Design tokens are declared once,** in `design-tokens.css`. A `:root` block in
  a route-chunk stylesheet leaks to every page for the rest of the session.

`CLAUDE.md` has the full set with the reasoning behind each.
