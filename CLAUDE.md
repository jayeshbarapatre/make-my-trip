# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
Full-stack travel platform (MakeMyTrip clone) supporting flights, hotels, buses, cabs, trains, and more. Built with React 18 + Vite (frontend) and Node.js + Express + MongoDB/Firestore (backend). Includes complete user booking system and admin panel for content management.

## Monorepo Structure
```
make-my-trip-practical/
├── makemytrip-frontend/    # React 18 + Vite app — http://localhost:5173
├── makemytrip-backend/     # Express API server — http://localhost:5000
└── files/                  # Reference docs (design specs, architecture)
```

## Dev Commands

### Frontend
```bash
cd makemytrip-frontend

npm run dev       # Start dev server (Vite)
npm run build     # Production build (dist/)
npm run preview   # Preview production build locally
npm run lint      # Run ESLint
```

### Backend
```bash
cd makemytrip-backend

npm run dev              # Start with --watch (auto-reload on changes)
npm run start            # Start normally (production)
npm run seed             # Seed MongoDB/Firestore with dummy flights + hotels
npm run seed:flights     # Seed flights only
```

## Frontend Stack
- **React 18** + **Vite** (ESM, fast HMR)
- **React Router DOM v7** — SPA with lazy-loaded pages
- **Redux Toolkit** — store: `search`, `auth` slices
- **TanStack React Query** — server state management, caching
- **Axios** — HTTP client with auth interceptors (`src/services/api.js`)
- **GSAP** + **Swiper** — animations and carousel components
- **html2canvas + jsPDF** — PDF ticket generation

### Authentication Pattern
- **User Auth**: `src/context/AuthContext.jsx` wraps app, stores JWT in localStorage
- **Admin Auth**: `src/context/AdminContext.jsx` for admin users (separate login flow)
- Email/password + phone/OTP login paths supported
- Auto-restore session on page load via profile endpoint

### Key Frontend Directories
| Path | Purpose |
|------|---------|
| `src/pages/` | Main page components (HomePage, search results, booking flows, admin pages) |
| `src/components/` | Reusable UI components (Header, Footer, cards, forms) |
| `src/context/` | AuthContext, AdminContext — global state |
| `src/services/` | API wrappers: authService, flightService, hotelService, adminService |
| `src/store/` | Redux store configuration |
| `src/config/` | Axios base config |

### Key Frontend Files
| File | Purpose |
|------|---------|
| `src/App.jsx` | Router setup, wraps with AuthProvider, Header, Footer |
| `src/pages/HomePage.jsx` | Landing page with hero search and below-fold sections |
| `src/pages/SearchResultsPage.jsx` | Flight search results with filters |
| `src/pages/BookingPage.jsx` | Flight traveller details + price summary |
| `src/pages/HotelListingPage.jsx` | Hotel search & filter |
| `src/pages/HotelDetailsPage.jsx` | Hotel detail view, date/room picker |
| `src/pages/AdminDashboard.jsx` | Admin home — stats, revenue, bookings |
| `src/pages/AdminFlights.jsx` | Flight CRUD (create/list/edit/delete) |
| `src/pages/AdminHotels.jsx` | Hotel CRUD |
| `src/context/AuthContext.jsx` | User auth state (login, register, OTP verify, logout) |
| `src/context/AdminContext.jsx` | Admin auth state (separate from user auth) |
| `src/services/api.js` | Axios instance with interceptors (JWT injection, error handling) |
| `src/services/authService.js` | User login/register/OTP endpoints |
| `src/services/adminService.js` | Admin CRUD endpoints |
| `src/services/flightService.js` | Flight search & details |
| `src/services/hotelService.js` | Hotel search & details |

### Frontend .env
File: `makemytrip-frontend/.env.local`
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Backend Stack
- **Node.js ESM** (always use `import/export`, never `require()`)
- **Express.js** — REST API with versioned routes (`/api/v1/*`)
- **MongoDB + Mongoose** — primary database (users, bookings, content)
- **Firebase Admin SDK** — Firestore for flights/hotels/availability (fallback/hybrid)
- **Prisma** — optional ORM configuration for structured data
- **JWT (`jsonwebtoken`)** — token-based auth (Bearer scheme)
- **bcryptjs** — password hashing
- **Nodemailer** — email notifications (booking confirmations)
- **node-cache** — in-memory caching for search results

### Authentication Middleware
- **User Auth**: `src/middleware/auth.js` — validates Bearer tokens, attaches `req.user`
- **Admin Auth**: `src/middleware/adminAuth.js` — validates admin tokens + role check
- Both required for protected endpoints

### API Routes Structure
All routes support dual versioning: `/api/*` and `/api/v1/*` (both work)

#### Authentication
```
POST   /api/v1/auth/register          — User registration
POST   /api/v1/auth/login             — User login
POST   /api/v1/auth/verify-otp        — OTP verification for mobile auth
POST   /api/v1/auth/logout            — Logout
GET    /api/v1/auth/profile           — Get current user (requires auth)
```

#### User Data
```
GET    /api/v1/user/profile           — User details (auth required)
PUT    /api/v1/user/profile           — Update profile (auth required)
GET    /api/v1/user/bookings          — My bookings (auth required)
```

#### Flights
```
GET    /api/v1/flights                — Search flights (filters: from, to, date, passengers, minPrice, maxPrice, airline, departureWindow)
GET    /api/v1/flights/:id            — Flight details
POST   /api/v1/bookings/flights       — Create flight booking (auth required)
```

#### Hotels
```
GET    /api/v1/hotels                 — Search hotels (filters: city, checkIn, checkOut, guests, rooms, priceRange)
GET    /api/v1/hotels/:id             — Hotel details
POST   /api/v1/bookings/hotels        — Create hotel booking (auth required)
```

#### Autocomplete
```
GET    /api/v1/autocomplete/cities    — City suggestions for flight/hotel search
GET    /api/v1/autocomplete/airlines  — Airline list
```

#### Unified Search
```
GET    /api/v1/search?q=query         — Cross-service search (flights, hotels, buses, etc.)
```

#### Bookings
```
GET    /api/v1/bookings               — All bookings (admin, auth required)
GET    /api/v1/bookings/:id           — Booking details
POST   /api/v1/bookings/flights       — Create flight booking (auth required)
POST   /api/v1/bookings/hotels        — Create hotel booking (auth required)
```

#### Payments
```
POST   /api/v1/payment/create         — Initiate payment (Razorpay/Stripe)
POST   /api/v1/payment/verify         — Verify payment callback
```

#### Admin (all require `authenticateAdmin` + `adminOnly`)
```
# Auth
POST   /api/v1/admin/register         — Admin registration
POST   /api/v1/admin/login            — Admin login
GET    /api/v1/admin/profile          — Admin profile
PUT    /api/v1/admin/change-password  — Change admin password

# Dashboard
GET    /api/v1/admin/dashboard/stats          — Key metrics (bookings, revenue, users)
GET    /api/v1/admin/dashboard/revenue        — Revenue by date/service
GET    /api/v1/admin/dashboard/recent-bookings — Recent bookings list
GET    /api/v1/admin/dashboard/availability  — Seat/room availability

# Flights (15 endpoints)
POST   /api/v1/admin/flights                  — Create
GET    /api/v1/admin/flights                  — List all
GET    /api/v1/admin/flights/:id              — Get one
PUT    /api/v1/admin/flights/:id              — Update
DELETE /api/v1/admin/flights/:id              — Delete
PATCH  /api/v1/admin/flights/:id/toggle       — Toggle active/inactive status

# Hotels (17 endpoints)
POST   /api/v1/admin/hotels                   — Create
GET    /api/v1/admin/hotels                   — List all
GET    /api/v1/admin/hotels/:id               — Get one
PUT    /api/v1/admin/hotels/:id               — Update
DELETE /api/v1/admin/hotels/:id               — Delete
PATCH  /api/v1/admin/hotels/:id/toggle        — Toggle status
PUT    /api/v1/admin/hotels/:id/images        — Update hotel images
GET    /api/v1/admin/hotels/:id/images        — Get hotel images

# Buses (6 endpoints) — same pattern as flights
# Cabs (6 endpoints) — same pattern as flights
```

### Key Backend Files
| File | Purpose |
|------|---------|
| `src/index.js` | Express app setup, route registration, CORS, error handlers |
| `src/config/db.js` | MongoDB connection (Mongoose) + Prisma client |
| `src/config/firebase.js` | Firebase Admin SDK initialization |
| `src/middleware/auth.js` | JWT verification for users (Bearer token) |
| `src/middleware/adminAuth.js` | JWT + role verification for admins |
| `src/controllers/authController.js` | User register/login/OTP/logout |
| `src/controllers/adminAuthController.js` | Admin register/login/password change |
| `src/controllers/flightController.js` | Flight search/filter with availability checks |
| `src/controllers/flightAdminController.js` | Flight CRUD operations |
| `src/controllers/hotelController.js` | Hotel search/filter/availability |
| `src/controllers/hotelAdminController.js` | Hotel CRUD + image management |
| `src/controllers/bookingController.js` | Create/retrieve bookings with atomic availability decrement |
| `src/controllers/busAdminController.js` | Bus CRUD operations |
| `src/controllers/cabAdminController.js` | Cab CRUD operations |
| `src/controllers/paymentController.js` | Payment gateway integration |
| `src/controllers/dashboardController.js` | Admin dashboard stats/revenue queries |
| `src/controllers/autocompleteController.js` | Search suggestions |
| `src/controllers/userController.js` | User profile management |
| `scripts/seed.js` | Seed MongoDB with dummy data |
| `scripts/seedFlights.js` | Seed flights only |

### Backend .env
File: `makemytrip-backend/.env`
```
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/makemytrip
# OR MongoDB Atlas: mongodb+srv://user:pass@cluster.mongodb.net/makemytrip

# Firebase (optional if using Firestore for some data)
FIREBASE_PROJECT_ID=your-project
FIREBASE_CLIENT_EMAIL=your-email@appspot.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Email (optional for booking confirmations)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Payment Gateway (Razorpay/Stripe)
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret
```

### Firebase Credentials (Optional)
If using Firestore alongside MongoDB:
- Place `serviceAccountKey.json` in `makemytrip-backend/` root (listed in .gitignore)
- OR set env vars: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`
- Firestore collections: `flights`, `hotels`, `bookings` (for high-velocity data)

## Data Models

### MongoDB Collections
- **users** — { email, phone, name, passwordHash, profile, createdAt }
- **admins** — { email, passwordHash, role, permissions, lastLogin }
- **bookings** — { bookingId, userId, bookingType (flight/hotel), details, totalPrice, status }
- **flights** — { from, to, departureTime, arrivalTime, durationMinutes, price, seatsAvailable, airlineName }
- **hotels** — { name, city, address, price, roomsAvailable, rating, amenities, images }
- **buses** — { from, to, departureTime, arrivalTime, price, seatsAvailable }
- **cabs** — { from, to, price, capacity, type }

### Availability Tracking
- Flight/Hotel bookings use **atomic increment** (`Mongoose: findByIdAndUpdate`, `Firestore: increment()`) to decrement `seatsAvailable` / `roomsAvailable`
- Check availability **before** creating booking (atomic read-modify-write in controller)
- No overbooking possible — race condition safe

## Design Conventions
- **Homepage**: Hero section owns navbar (logo + nav + search). Header.jsx returns null on `/`
- **Images**: Unsplash CDN with responsive sizing: `https://images.unsplash.com/photo-{ID}?auto=format&fit=crop&w={w}&h={h}&q=80`
- **Responsive breakpoints**: 900px (tablet), 600px (mobile)
- **Colors**: Primary blue `#003580`, accent red `#e63946`, CTA blue `#1a73e8`
- **CSS variables**: `--ac` (airline brand color), `--hc` (hotel brand color) for dynamic theming
- **Price calculation**: Always centralize — use utility functions, never duplicate logic. Format: `basePrice × quantity × nights + tax`
- **Date validation**: Checkout > checkin, minimum 1 night, maximum 90 nights
- **Notifications**: Use custom toast system (bottom-right, auto-dismiss) instead of browser alerts

## Coding Rules
- Backend is **ESM only** — import/export everywhere, never require()
- No comments unless WHY is non-obvious (avoid describing WHAT — code should be self-evident)
- No premature abstractions — three similar lines is better than a generic helper
- Validate only at boundaries: user input, external API responses, form submissions
- Price calculations must be centralized in utility functions
- Availability checks must happen atomically in booking controller
- MongoDB queries prefer Mongoose methods over raw operations for safety

## Key Architecture Patterns

### Price Calculation (Centralized)
All price logic should use utility functions (`src/utils/priceCalculator.js`):
```javascript
export const calculateFlightPrice = (flight, passengerCount) => { /* returns basePrice, tax, total */ }
export const calculateHotelPrice = (hotel, nightsCount, roomsCount) => { /* returns subtotal, tax, total */ }
```
Never duplicate pricing math in components.

### Availability Tracking
1. Fetch resource and check `seatsAvailable` / `roomsAvailable`
2. If insufficient, reject with 400 error
3. If sufficient, atomically decrement in same transaction as booking creation
4. MongoDB: `findByIdAndUpdate(..., { $inc: { seatsAvailable: -n } })`
5. Firestore: `updateDoc(..., { seatsAvailable: increment(-n) })`

### Error Handling
- Validate input at API endpoint level (check dates, guest counts, email format)
- Return 400 for validation failures, 403 for auth, 404 for not found, 500 for server errors
- Frontend: catch errors, display toast notifications (not browser alerts)
- Provide user-friendly error messages (not technical stack traces)

### Authentication Flow
1. **User**: Login → JWT token → localStorage → auto-restore on page load via `/auth/profile`
2. **Admin**: Separate login → admin JWT → localStorage (`adminToken`) → `AdminContext`
3. Protected routes check token validity before rendering (frontend) + verify in middleware (backend)
4. OTP flow: POST `/auth/send-otp`, then POST `/auth/verify-otp` with email/phone

### Booking Flow
1. Search → Select item (flight/hotel) → Fill details (passengers/dates) → Review price
2. POST `/bookings/{type}` with userId, itemId, quantity (passengers/rooms/nights), totalPrice
3. Backend: Validate availability → decrement atomically → create booking record → return bookingId
4. Frontend: Show success toast, redirect to confirmation page, send email notification

## Performance Notes
- Use React Query for server state (caching, refetch on window focus)
- Lazy-load page components with React.lazy() + Suspense
- Memoize expensive calculations (useMemo)
- Debounce search/filter inputs (250-500ms)
- Compress images, use WebP format where possible
- In-memory search filtering for <10k results; use backend pagination for larger datasets

## Security Checklist
- [ ] JWT secret changed before production
- [ ] MongoDB connection string uses strong password
- [ ] CORS_ORIGIN restricted to frontend domain only
- [ ] Admin endpoints protected with `authenticateAdmin` + `adminOnly` middleware
- [ ] Booking endpoints verify user owns resource (userId check)
- [ ] Passwords hashed with bcrypt (salt rounds ≥ 10)
- [ ] Firestore security rules defined (not in test mode)
- [ ] Never log sensitive data (tokens, passwords, PII)
- [ ] HTTPS enforced in production
- [ ] Rate limiting on auth endpoints (brute-force protection)
- [ ] Input sanitization on user-facing endpoints
