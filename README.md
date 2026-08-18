# TripOra - Travel Booking Platform

TripOra is a comprehensive, full-stack travel booking platform inspired by major industry leaders like MakeMyTrip. It allows users to search, book, and manage travel arrangements across various modes of transportation and accommodations, while providing robust dashboards for vendors and administrators.

## 🚀 Features

The platform is divided into three major portals:

### 1. User Portal (B2C)
* **Flights:** Search and book domestic and international flights.
* **Hotels:** Browse accommodations, view room details, and book stays.
* **Buses & Trains:** Search routes, select seats, and book tickets for road and rail journeys.
* **Cabs:** Book intercity cabs, airport transfers, and outstation rides.
* **User Dashboard:** Manage profile, view upcoming trips, cancel bookings, and download PDF tickets.
* **Checkout & Payment:** Integrated simulated payment flow (Razorpay style) with coupon support, convenience fees, and tax calculation.

### 2. Vendor Portal (B2B)
* **Inventory Management:** Vendors can add, edit, and manage their listings across Flights, Hotels, Buses, Cabs, and Trains.
* **Booking Overview:** Vendors can view real-time bookings assigned to their inventory.
* **Revenue Dashboard:** Visual charts and statistics showing vendor revenue, upcoming bookings, and service-level breakdowns.

### 3. Admin Portal
* **System Overview:** Comprehensive dashboard showing platform-wide revenue, users, and booking counts.
* **User & Vendor Management:** Approve/reject vendor applications, manage user accounts, and enforce platform security.
* **Booking Management:** Search, view, confirm, or cancel bookings across the entire platform.
* **Inventory Approval:** Admins review and approve new inventory submissions from vendors before they go live to users.

## 🛠 Tech Stack

### Frontend
* **Framework:** React 19 / Vite
* **Routing:** React Router DOM v7
* **State Management:** Redux Toolkit / React Query
* **Styling:** CSS/TailwindCSS (via DaisyUI), GSAP for animations
* **Icons:** React Icons
* **Charts:** Recharts
* **Utilities:** html2canvas, jsPDF (for ticket generation)
* **Testing:** Playwright (E2E), Vitest

### Backend
* **Runtime:** Node.js v22+
* **Framework:** Express.js
* **Database:** Google Firebase (Firestore Emulator used locally)
* **Authentication:** Firebase Admin Auth & JWT
* **Security & Utils:** Bcrypt.js, Express Rate Limit, Winston (Logging), Node-cache
* **Payments:** Razorpay API (Integration format)
* **Emails:** Nodemailer / Handlebars (Template driven emails)
* **Testing:** Native Node.js test runner

## 📦 Project Structure

The repository is organized as a monorepo containing two main directories:

```
make-my-trip-practical/
├── makemytrip-frontend/      # React + Vite Client Application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── context/          # React Context (Auth, Theme)
│   │   ├── pages/            # Page-level components
│   │   ├── redux/            # Redux store and slices
│   │   ├── services/         # API integration methods
│   │   └── utils/            # Helper functions
│   └── package.json
│
└── makemytrip-backend/       # Node.js + Express API
    ├── src/
    │   ├── config/           # Environment and Firebase configuration
    │   ├── controllers/      # Route handlers and business logic
    │   ├── middleware/       # Auth and validation middleware
    │   ├── routes/           # Express route definitions
    │   ├── services/         # Database and third-party integrations
    │   └── utils/            # Helper functions
    ├── tests/                # API Test suites
    ├── scripts/              # Database seeding and migration scripts
    └── package.json
```

## 💻 Running the Project Locally

### Prerequisites
* Node.js v22 or higher
* npm or yarn
* Firebase CLI (`npm i -g firebase-tools`)
* Java (required for Firebase Emulator)

### 1. Setup Backend
```bash
cd makemytrip-backend
npm install

# Start the Firebase Emulator (Requires Java)
npm run emulator

# In a new terminal, run database seeds (if starting fresh)
npm run seed:firestore

# Start the development server (runs on port 5000)
npm run dev
```

### 2. Setup Frontend
```bash
cd makemytrip-frontend
npm install

# Start the Vite development server (runs on port 5173)
npm run dev
```

### 3. Accessing the Application
* **Frontend Application:** `http://localhost:5173`
* **Backend API API:** `http://localhost:5000`
* **Firestore Emulator UI:** `http://localhost:4000`

## 🔒 Environment Variables
Both `makemytrip-frontend` and `makemytrip-backend` require `.env` files. Ensure these are correctly populated based on your specific Firebase project and configuration requirements.

*Typical Backend `.env`:*
```env
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=makemytrip-d9272
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY=...
JWT_SECRET=your_secret_key
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080
```

*Typical Frontend `.env`:*
```env
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing
1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---
*Developed for TripOra - Travel Made Easy.*
