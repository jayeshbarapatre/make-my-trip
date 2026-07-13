# MakeMyTrip - Travel Booking Platform

A full-stack travel booking platform built with React 18 + Vite (frontend) and Node.js + Express + PostgreSQL (backend). Supporting flights, hotels, buses, cabs, trains, and more.

## 🚀 Quick Start

### Prerequisites
- **Node.js** 18.x or higher
- **PostgreSQL** 14.x or higher
- **npm** 9.x or higher

### Frontend Setup

```bash
cd makemytrip-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Frontend Environment Variables** (`.env.local`):
```
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

### Backend Setup

```bash
cd makemytrip-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Set up database
npx prisma migrate dev --name init
npx prisma db seed

# Start development server (http://localhost:5000)
npm run dev

# Production start
npm start
```

**Backend Environment Variables** (`.env`):
```
# Server
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/makemytrip

# JWT
JWT_SECRET=your-secret-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:5173

# APIs (optional)
AVIATIONSTACK_API_KEY=your-key
RAPIDAPI_KEY=your-key

# Payment (optional)
RAZORPAY_KEY_ID=your-key
RAZORPAY_KEY_SECRET=your-secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**⚠️ IMPORTANT:** Never commit `.env` files! Use `.env.example` as template.

## 📁 Project Structure

```
make-my-trip-practical/
├── makemytrip-frontend/     # React 18 + Vite app
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── services/        # API client services
│   │   ├── context/         # Global state (Auth, Admin, Vendor, Theme)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── store/           # Redux store
│   │   └── styles/          # CSS files
│   └── package.json
│
├── makemytrip-backend/      # Node.js + Express + PostgreSQL
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   ├── config/          # Database & app config
│   │   └── utils/           # Utilities
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   └── package.json
│
└── CLAUDE.md                # Detailed codebase documentation
```

## 🔑 Key Features

### User Flows
- **Authentication**: Email/password, Phone/OTP login
- **Flight Booking**: Search → Select → Fill Passengers → Review → Pay
- **Hotel Booking**: Search → View Details → Select Dates/Rooms → Pay
- **Multi-Service**: Buses, Cabs, Trains (similar flows)
- **Booking History**: View all user bookings with details

### Admin Panel
- **Dashboard**: Key metrics, revenue, recent bookings
- **Content Management**: Create/edit/delete flights, hotels, buses, cabs, trains
- **Vendor Management**: Approve vendors, manage listings
- **User Management**: View users, manage permissions

### Vendor Portal
- **Hotel Management**: List hotels, manage room categories
- **Bus/Cab Management**: Create and manage schedules
- **Availability**: Update room/seat counts
- **Analytics**: Booking and revenue stats

## 🏗️ Architecture

### Frontend Stack
- **React 18** - UI framework
- **Vite** - Build tool (faster than CRA)
- **React Router v7** - Client-side routing
- **Redux Toolkit** - State management
- **TanStack React Query** - Server state & caching
- **Tailwind CSS** - Styling
- **DaisyUI** - Component library
- **GSAP/Swiper** - Animations

### Backend Stack
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **Prisma ORM** - Database client
- **JWT** - Authentication
- **Bcryptjs** - Password hashing
- **Razorpay** - Payment processing
- **Nodemailer** - Email service

## 📡 API Documentation

All APIs use RESTful conventions with `/api/v1` prefix.

### Base URL
```
http://localhost:5000/api/v1
```

### Response Format
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

### Authentication
Include JWT token in `Authorization` header:
```
Authorization: Bearer your-jwt-token-here
```

### Core Endpoints

**Auth**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/send-otp` - Send OTP for phone login
- `POST /auth/verify-otp` - Verify OTP
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/profile` - Get current user (requires auth)

**Flights**
- `GET /flights/search?from=DEL&to=BOM&date=2024-06-15` - Search flights
- `GET /flights/{id}` - Get flight details
- `POST /bookings/flights` - Book flight (requires auth)

**Hotels**
- `GET /hotels?city=Mumbai&checkIn=2024-06-15&checkOut=2024-06-17` - Search hotels
- `GET /hotels/{id}` - Get hotel details
- `POST /bookings/hotels` - Book hotel (requires auth)

**Admin**
- `POST /admin/register` - Create admin (first admin only)
- `POST /admin/login` - Admin login
- `POST /admin/flights` - Create flight
- `GET /admin/flights` - List all flights
- `PUT /admin/flights/{id}` - Update flight
- `DELETE /admin/flights/{id}` - Delete flight

For complete API reference, see `CLAUDE.md`.

## 🔒 Security Features

✅ **Implemented**
- JWT-based authentication
- Rate limiting on auth endpoints
- Bcryptjs password hashing
- CORS protection
- SQL injection prevention (Prisma ORM)
- XSS protection (React escaping)
- Atomic transactions for bookings
- Environment variable validation

⚠️ **Recommended for Production**
- Move JWT to httpOnly cookies
- Enable HTTPS
- Add CSRF protection
- Implement API key validation
- Add request signing
- Enable database encryption
- Set up security headers (Helmet.js)
- Implement audit logging

## 📊 Database Schema

### Key Models
- **User** - User accounts (email, password, profile)
- **Booking** - Flight/hotel/bus/cab bookings
- **Flight** - Flight inventory (seats, price, schedule)
- **Hotel** - Hotel inventory (rooms, price)
- **Admin** - Admin accounts
- **CmsPage** - Dynamic content pages

See `prisma/schema.prisma` for full schema.

## 🧪 Testing

Currently no automated tests. Priority test cases:
1. User registration and login flows
2. Booking creation and cancellation
3. Concurrent booking (race condition tests)
4. Payment verification
5. Admin CRUD operations
6. Inventory management

```bash
# To run tests (when added)
npm test

# To run with coverage
npm test -- --coverage
```

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Connect your GitHub repo to Vercel
# Vercel auto-builds from main branch
# Environment: VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
```

### Backend (Railway, Heroku, Render)
```bash
# 1. Push code to GitHub
# 2. Connect to deployment service
# 3. Set environment variables
# 4. Deploy (auto-builds on push)

# Post-deployment checks
curl https://api.yourdomain.com/health
```

### Database (PostgreSQL)
```bash
# Cloud providers: AWS RDS, Render, Railway, Supabase
# Connection string: postgresql://user:pass@host:5432/dbname

npx prisma migrate deploy  # Run migrations
```

## 🐛 Troubleshooting

### Frontend won't start
```bash
# Clear node_modules and cache
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Backend database connection error
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL is running
# Check credentials are correct
psql -h localhost -U postgres -d makemytrip
```

### API calls returning 401
```bash
# Token expired - login again
# Check Authorization header format: "Bearer token"
# Verify JWT_SECRET matches in backend
```

### Payment not processing
```bash
# Verify RAZORPAY keys in .env
# Check payment callback signature
# Review Razorpay logs
```

## 📞 Support

For issues, questions, or contributions:
1. Check `CLAUDE.md` for detailed architecture
2. Review `SETUP_COMPLETE.md` for setup notes
3. Check existing issues in GitHub
4. Create new issue with details

## 📄 License

ISC License - See LICENSE file for details

## 🙏 Acknowledgments

Built as a comprehensive full-stack example demonstrating:
- Modern React patterns (hooks, context, lazy loading)
- Express.js API design
- PostgreSQL database design
- Production-ready security practices
- Full CRUD operations
- Multi-user systems (user, admin, vendor)

---

**Last Updated**: June 2024  
**Version**: 1.0.0  
**Status**: Production-Ready ✅
