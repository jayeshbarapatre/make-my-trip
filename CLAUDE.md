# MakeMyTrip Clone — Claude Code Instructions

## Project Overview
Full-stack MakeMyTrip clone built with React + Vite (frontend) and Node.js + Express + Firebase Firestore (backend).

## Monorepo Structure
```
make-my-trip-practical/
├── makemytrip-frontend/   # React 18 + Vite app — runs on http://localhost:5173
├── makemytrip-backend/    # Express API server   — runs on http://localhost:5000
└── files/                 # Reference docs (architecture, design notes)
```

## Dev Commands
```bash
# Frontend
cd makemytrip-frontend && npm run dev

# Backend
cd makemytrip-backend && npm run dev    # uses node --watch
cd makemytrip-backend && npm run seed   # seed Firestore with dummy data

# Build check
cd makemytrip-frontend && npm run build
```

## Frontend Stack
- **React 18** + **Vite** (ESM)
- **React Router DOM** — routes: `/`, `/flights/results`, `/booking/:flightId`, `/login`
- **Redux Toolkit** — slices: `search` (`searchReducer.js`), `auth` (`authReducer.js`)
- **TanStack React Query** — server state / data fetching
- **Axios** — HTTP client with interceptors (`src/services/api.js`)
- **CSS**: inline styles for components + dedicated CSS files in `src/styles/` (Hero.css, Sections.css)

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/App.jsx` | Router setup, wraps all pages with Header + Footer |
| `src/pages/HomePage.jsx` | Main homepage — all sections live here |
| `src/components/Common/Header.jsx` | Sticky header — hidden on `/` (hero owns top bar) |
| `src/components/Common/Footer.jsx` | Dark footer with 4-column links |
| `src/styles/Hero.css` | Hero section CSS (`.hero-bg`, `.search-inputs`, `.fare-chip`, etc.) |
| `src/styles/Sections.css` | Below-fold sections CSS (offers, airlines, hotels, collections) |
| `src/store/index.js` | Redux store |
| `src/config/api.config.js` | Axios base URL config |
| `src/services/flightService.js` | Flight search API calls |
| `src/services/authService.js` | Login/register API calls |

### Frontend .env
File: `makemytrip-frontend/.env.local`
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Backend Stack
- **Node.js ESM** (`"type": "module"` in package.json — always use `import/export`, never `require()`)
- **Express.js** — REST API
- **Firebase Admin SDK** — Firestore database
- **JWT** (`jsonwebtoken`) — auth tokens, Bearer scheme
- **bcryptjs** — password hashing

### API Routes
```
GET  /health
POST /api/v1/auth/register
POST /api/v1/auth/login
GET  /api/v1/flights?from=&to=&date=&passengers=
GET  /api/v1/flights/:id
POST /api/v1/bookings           (auth required)
GET  /api/v1/bookings/my        (auth required)
```

### Key Backend Files
| File | Purpose |
|------|---------|
| `src/index.js` | Express app entry — CORS, routes, 404 handler |
| `src/config/firebase.js` | Firebase Admin init (loads serviceAccountKey.json or env vars) |
| `src/middleware/auth.js` | JWT Bearer token middleware |
| `src/controllers/authController.js` | register/login with bcrypt + JWT |
| `src/controllers/flightController.js` | Firestore flight queries (in-memory filter for search) |
| `src/controllers/bookingController.js` | Bookings + atomic seat decrement via FieldValue.increment |
| `scripts/seed.js` | Seeds 150 flights + 15 hotels into Firestore |

### Backend .env
File: `makemytrip-backend/.env`
```
PORT=5000
NODE_ENV=development
JWT_SECRET=change_this_secret_in_production
CORS_ORIGIN=http://localhost:5173
```

### Firebase Credentials
- **Preferred**: Place `serviceAccountKey.json` (downloaded from Firebase Console) in `makemytrip-backend/` root
- **Fallback**: Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` in `.env`
- `serviceAccountKey.json` is in `.gitignore` — never commit it
- Firestore collections: `users`, `flights`, `bookings`, `hotels`

## Design Conventions
- **Homepage layout**: Hero section owns the full top bar (logo + nav + search). `Header.jsx` returns `null` on `/`.
- **Unsplash images**: `https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w={w}&h={h}&q=80`
  - Helper in HomePage: `const img = (id, w=800, h=500) => \`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80\``
- **Responsive breakpoints**: 900px (tablet) and 600px (mobile) in CSS media queries
- **Colors**: Primary blue `#003580`, accent red `#e63946`, CTA blue `#1a73e8`
- **CSS variables**: `--ac` (airline brand color), `--hc` (hotel brand color) for dynamic theming

## Coding Rules
- Backend is **ESM only** — use `import/export` everywhere, never `require()`
- No comments unless the WHY is non-obvious
- No extra abstractions — keep it simple and direct
- Validate only at system boundaries (user input, external API responses)
- Firestore doesn't support regex — filter/sort in-memory after fetching

## Security Notes
- Never commit `.env` or `serviceAccountKey.json`
- JWT secret must be changed before any production deployment
- Firestore is currently in test mode — add security rules before going live
