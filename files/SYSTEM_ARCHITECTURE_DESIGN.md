# Hotel & Flight Booking System - Architecture Design Document

## 1. System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CDN / Static Assets                       │
│                      (AWS S3 + CloudFront)                       │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
┌─────────────┬───────────────┴────────────┬─────────────┐
│             │                            │             │
▼             ▼                            ▼             ▼
┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Admin  │ │ Vendor   │ │  User    │ │  Mobile  │
│ Portal  │ │ Portals  │ │ Portal   │ │   App    │
└────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │           │            │             │
     └───────────┼────────────┼─────────────┘
                 │            │
         ┌───────▼────────────▼───────┐
         │   API Gateway / Load Balancer  │
         │   (Rate Limiting, Routing)     │
         └───────┬──────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
┌─────────┐ ┌──────────┐ ┌─────────┐
│ Auth    │ │  Business│ │ Payment │
│Service  │ │ Logic    │ │ Service │
│(JWT)    │ │(Node.js) │ │(Razorpay)
└─────────┘ └──────────┘ └─────────┘
    │            │            │
    └────────────┼────────────┘
                 │
    ┌────────────┼──────────────┐
    │            │              │
    ▼            ▼              ▼
┌─────────┐ ┌──────────┐ ┌──────────┐
│PostgreSQL│ │  Redis  │ │ Message  │
│Database  │ │  Cache  │ │ Queue    │
│(Primary) │ │(Sessions)│ │(Bull/RQ) │
└─────────┘ └──────────┘ └──────────┘
    │
    ▼
┌──────────┐
│ MongoDB  │
│(Analytics│
│  Logs)   │
└──────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Admin, Vendor, User portals |
| **Backend** | Node.js + Express | REST API server |
| **Database** | PostgreSQL | Primary relational data |
| **Cache** | Redis | Sessions, rate limiting, search cache |
| **Storage** | AWS S3 | Hotel images, documents |
| **Email** | SendGrid / Nodemailer | Credentials, confirmations, receipts |
| **Payments** | Razorpay / Stripe | Payment processing |
| **Message Queue** | Bull + Redis | Async tasks (emails, invoices) |
| **Logging** | Winston / Morgan | Structured logging |
| **Auth** | JWT + Refresh Tokens | Stateless authentication |

---

## 2. Database Schema Design

### PostgreSQL Schema

#### Users Table
```sql
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role ENUM('USER', 'ADMIN', 'HOTEL_VENDOR', 'FLIGHT_VENDOR') DEFAULT 'USER',
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
);
```

#### Hotels Table
```sql
CREATE TABLE hotels (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  address VARCHAR(500) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100),
  country VARCHAR(100),
  postal_code VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone VARCHAR(20),
  email VARCHAR(255),
  star_rating DECIMAL(3, 1) DEFAULT 0,
  amenities JSONB DEFAULT '[]', -- ['WiFi', 'Parking', 'Pool', 'Gym']
  check_in_time TIME DEFAULT '14:00:00',
  check_out_time TIME DEFAULT '11:00:00',
  cancellation_policy TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_city (city),
  INDEX idx_active (is_active),
  FULLTEXT KEY ft_search (name, city, address)
);
```

#### Hotel Images Table
```sql
CREATE TABLE hotel_images (
  id BIGSERIAL PRIMARY KEY,
  hotel_id BIGINT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  image_key VARCHAR(255), -- S3 key
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hotel_id (hotel_id)
);
```

#### Rooms Table
```sql
CREATE TABLE rooms (
  id BIGSERIAL PRIMARY KEY,
  hotel_id BIGINT NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  category_name VARCHAR(100) NOT NULL, -- 'Deluxe', 'Suite', 'Standard'
  description TEXT,
  capacity INT NOT NULL, -- guests per room
  total_rooms INT NOT NULL,
  available_rooms INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  price_currency VARCHAR(3) DEFAULT 'USD',
  amenities JSONB DEFAULT '[]', -- room-level amenities
  images JSONB DEFAULT '[]', -- array of image URLs
  max_occupancy INT,
  cancellation_policy TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_active (is_active),
  CONSTRAINT check_available_rooms CHECK (available_rooms >= 0 AND available_rooms <= total_rooms)
);
```

#### Hotel Bookings Table
```sql
CREATE TABLE hotel_bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_number VARCHAR(50) UNIQUE NOT NULL, -- HB20250519001
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  hotel_id BIGINT NOT NULL REFERENCES hotels(id) ON DELETE RESTRICT,
  room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_rooms INT DEFAULT 1,
  number_of_guests INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  taxes_fees DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED') DEFAULT 'PENDING',
  payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  payment_method VARCHAR(50), -- 'CARD', 'RAZORPAY', 'UPI'
  payment_id VARCHAR(255), -- Razorpay payment ID
  guest_name VARCHAR(255),
  guest_email VARCHAR(255),
  guest_phone VARCHAR(20),
  special_requests TEXT,
  checked_in_at TIMESTAMP,
  checked_out_at TIMESTAMP,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  invoice_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_hotel_id (hotel_id),
  INDEX idx_status (status),
  INDEX idx_check_in (check_in_date),
  INDEX idx_booking_number (booking_number),
  CONSTRAINT check_dates CHECK (check_out_date > check_in_date)
);
```

#### Airlines Table
```sql
CREATE TABLE airlines (
  id BIGSERIAL PRIMARY KEY,
  vendor_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  airline_name VARCHAR(255) NOT NULL,
  airline_code VARCHAR(10) UNIQUE NOT NULL, -- 'AI', 'UK', 'S6'
  iata_code VARCHAR(3),
  logo_url VARCHAR(500),
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vendor_id (vendor_id),
  INDEX idx_code (airline_code)
);
```

#### Routes Table
```sql
CREATE TABLE routes (
  id BIGSERIAL PRIMARY KEY,
  airline_id BIGINT NOT NULL REFERENCES airlines(id) ON DELETE CASCADE,
  flight_code VARCHAR(10) NOT NULL, -- 'AI123', 'UK456'
  source_city VARCHAR(100) NOT NULL,
  source_airport_code VARCHAR(3),
  destination_city VARCHAR(100) NOT NULL,
  destination_airport_code VARCHAR(3),
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration_minutes INT,
  aircraft_type VARCHAR(100), -- 'Boeing 737'
  total_seats INT NOT NULL,
  available_seats INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  operates_on JSONB DEFAULT '["MON","TUE","WED","THU","FRI","SAT","SUN"]', -- days
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_airline_id (airline_id),
  INDEX idx_source_dest (source_city, destination_city),
  INDEX idx_active (is_active),
  CONSTRAINT check_seats CHECK (available_seats >= 0 AND available_seats <= total_seats)
);
```

#### Flight Bookings Table
```sql
CREATE TABLE flight_bookings (
  id BIGSERIAL PRIMARY KEY,
  booking_number VARCHAR(50) UNIQUE NOT NULL, -- FB20250519001
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  route_id BIGINT NOT NULL REFERENCES routes(id) ON DELETE RESTRICT,
  airline_id BIGINT NOT NULL REFERENCES airlines(id),
  departure_date DATE NOT NULL,
  number_of_passengers INT NOT NULL,
  base_price DECIMAL(10, 2) NOT NULL,
  taxes_fees DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('PENDING', 'CONFIRMED', 'BOARDED', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
  payment_status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  payment_method VARCHAR(50),
  payment_id VARCHAR(255),
  passengers JSONB NOT NULL, -- array of {name, email, phone, seat_number, dob}
  special_requests TEXT,
  baggage_allowance INT, -- kg
  cancellation_policy TEXT,
  boarded_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  ticket_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_route_id (route_id),
  INDEX idx_status (status),
  INDEX idx_departure_date (departure_date),
  CONSTRAINT check_passengers CHECK (number_of_passengers > 0)
);
```

#### Payments Table
```sql
CREATE TABLE payments (
  id BIGSERIAL PRIMARY KEY,
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id),
  booking_type ENUM('HOTEL', 'FLIGHT') NOT NULL,
  booking_id BIGINT, -- hotel_bookings.id or flight_bookings.id
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  gateway VARCHAR(50), -- 'RAZORPAY', 'STRIPE'
  gateway_transaction_id VARCHAR(255),
  status ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_transaction_id (transaction_id)
);
```

#### Invoices Table
```sql
CREATE TABLE invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- INV20250519001
  booking_type ENUM('HOTEL', 'FLIGHT') NOT NULL,
  booking_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD',
  issued_date DATE,
  due_date DATE,
  status ENUM('DRAFT', 'SENT', 'PAID', 'CANCELLED') DEFAULT 'DRAFT',
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_booking_id (booking_id),
  INDEX idx_invoice_number (invoice_number)
);
```

#### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id),
  action VARCHAR(100),
  resource_type VARCHAR(50), -- 'HOTEL', 'ROOM', 'BOOKING', 'PAYMENT'
  resource_id BIGINT,
  changes JSONB, -- before/after values
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at)
);
```

---

## 3. API Endpoints Structure

### Authentication Endpoints

```
POST   /api/v1/auth/register              Register new user
POST   /api/v1/auth/login                 Login user
POST   /api/v1/auth/refresh-token         Refresh JWT token
POST   /api/v1/auth/logout                Logout user
POST   /api/v1/auth/forgot-password       Request password reset
POST   /api/v1/auth/reset-password        Reset password
POST   /api/v1/auth/verify-email          Verify email address
GET    /api/v1/auth/profile               Get current user profile
PUT    /api/v1/auth/profile               Update user profile
```

### Admin Portal APIs

#### Admin Dashboard
```
GET    /api/v1/admin/dashboard/stats              Overall stats
GET    /api/v1/admin/dashboard/revenue            Revenue metrics
GET    /api/v1/admin/dashboard/users              User statistics
GET    /api/v1/admin/dashboard/bookings           Recent bookings
```

#### Hotel Vendor Management (Admin)
```
POST   /api/v1/admin/vendors/hotel                Register hotel vendor
GET    /api/v1/admin/vendors/hotel                List all hotel vendors
GET    /api/v1/admin/vendors/hotel/:id            Get vendor details
PUT    /api/v1/admin/vendors/hotel/:id            Update vendor
DELETE /api/v1/admin/vendors/hotel/:id            Delete vendor
POST   /api/v1/admin/vendors/hotel/:id/send-credentials  Send login credentials

PATCH  /api/v1/admin/vendors/hotel/:id/verify    Verify vendor account
PATCH  /api/v1/admin/vendors/hotel/:id/suspend   Suspend vendor account
```

#### Flight Vendor Management (Admin)
```
POST   /api/v1/admin/vendors/airline              Register airline vendor
GET    /api/v1/admin/vendors/airline              List all airline vendors
GET    /api/v1/admin/vendors/airline/:id         Get vendor details
PUT    /api/v1/admin/vendors/airline/:id         Update vendor
DELETE /api/v1/admin/vendors/airline/:id         Delete vendor
POST   /api/v1/admin/vendors/airline/:id/send-credentials Send login credentials

PATCH  /api/v1/admin/vendors/airline/:id/verify   Verify vendor
PATCH  /api/v1/admin/vendors/airline/:id/suspend  Suspend vendor
```

#### Hotel Management (Admin)
```
GET    /api/v1/admin/hotels                      List all hotels
GET    /api/v1/admin/hotels/:id                  Get hotel details
PATCH  /api/v1/admin/hotels/:id/verify           Verify hotel
PATCH  /api/v1/admin/hotels/:id/suspend          Suspend hotel
```

#### Booking Management (Admin)
```
GET    /api/v1/admin/bookings/hotel              All hotel bookings
GET    /api/v1/admin/bookings/flight             All flight bookings
GET    /api/v1/admin/bookings/:id                Booking details
```

### Hotel Vendor Portal APIs

#### Hotel Management
```
GET    /api/v1/vendor/hotels                     My hotels
POST   /api/v1/vendor/hotels                     Create new hotel
GET    /api/v1/vendor/hotels/:id                 Get hotel details
PUT    /api/v1/vendor/hotels/:id                 Update hotel
DELETE /api/v1/vendor/hotels/:id                 Delete hotel

POST   /api/v1/vendor/hotels/:id/images          Upload images
GET    /api/v1/vendor/hotels/:id/images          Get all images
DELETE /api/v1/vendor/hotels/:id/images/:img_id Delete image

PUT    /api/v1/vendor/hotels/:id/amenities       Update amenities
PUT    /api/v1/vendor/hotels/:id/policies        Update policies
```

#### Room Management
```
GET    /api/v1/vendor/hotels/:hotel_id/rooms           List rooms
POST   /api/v1/vendor/hotels/:hotel_id/rooms           Create room
GET    /api/v1/vendor/hotels/:hotel_id/rooms/:id      Get room
PUT    /api/v1/vendor/hotels/:hotel_id/rooms/:id      Update room
DELETE /api/v1/vendor/hotels/:hotel_id/rooms/:id      Delete room

PUT    /api/v1/vendor/hotels/:hotel_id/rooms/:id/availability Update availability
PUT    /api/v1/vendor/hotels/:hotel_id/rooms/:id/pricing      Update pricing
```

#### Booking Management
```
GET    /api/v1/vendor/bookings                   My bookings
GET    /api/v1/vendor/bookings/:id               Booking details
PATCH  /api/v1/vendor/bookings/:id/check-in     Mark check-in
PATCH  /api/v1/vendor/bookings/:id/check-out    Mark check-out
POST   /api/v1/vendor/bookings/:id/invoice       Generate invoice
GET    /api/v1/vendor/bookings/:id/invoice       Get invoice

GET    /api/v1/vendor/analytics/occupancy       Occupancy report
GET    /api/v1/vendor/analytics/revenue         Revenue report
```

### Flight Vendor Portal APIs

#### Airline Management
```
GET    /api/v1/vendor/airline                    My airline info
PUT    /api/v1/vendor/airline                    Update airline info
```

#### Route Management
```
GET    /api/v1/vendor/routes                     List all routes
POST   /api/v1/vendor/routes                     Create route
GET    /api/v1/vendor/routes/:id                 Get route details
PUT    /api/v1/vendor/routes/:id                 Update route
DELETE /api/v1/vendor/routes/:id                 Delete route

PUT    /api/v1/vendor/routes/:id/seats           Update seat availability
PUT    /api/v1/vendor/routes/:id/pricing         Update pricing
PUT    /api/v1/vendor/routes/:id/schedule        Update schedule
```

#### Flight Booking Management
```
GET    /api/v1/vendor/bookings                   My airline bookings
GET    /api/v1/vendor/bookings/:id               Booking details
PATCH  /api/v1/vendor/bookings/:id/confirm       Confirm booking
PATCH  /api/v1/vendor/bookings/:id/issue-ticket Issue ticket
POST   /api/v1/vendor/bookings/:id/ticket        Generate ticket

GET    /api/v1/vendor/analytics/occupancy       Occupancy by route
GET    /api/v1/vendor/analytics/revenue         Revenue by route
```

### User Portal APIs

#### Hotel Search & Booking
```
GET    /api/v1/hotels/search                     Search hotels
GET    /api/v1/hotels/:id                        Hotel details
GET    /api/v1/hotels/:id/rooms                  Available rooms
GET    /api/v1/hotels/:id/availability           Check availability

POST   /api/v1/bookings/hotel                    Create hotel booking
GET    /api/v1/bookings/hotel                    My hotel bookings
GET    /api/v1/bookings/hotel/:id                Booking details
PATCH  /api/v1/bookings/hotel/:id/cancel         Cancel booking
```

#### Flight Search & Booking
```
GET    /api/v1/flights/search                    Search flights
GET    /api/v1/flights/:id                       Flight details
GET    /api/v1/flights/:id/availability          Seat availability

POST   /api/v1/bookings/flight                   Create flight booking
GET    /api/v1/bookings/flight                   My flight bookings
GET    /api/v1/bookings/flight/:id               Booking details
PATCH  /api/v1/bookings/flight/:id/cancel        Cancel booking
```

#### Payments
```
POST   /api/v1/payments/create-order             Create payment order (Razorpay)
POST   /api/v1/payments/verify                   Verify payment
GET    /api/v1/payments/history                  Payment history
```

#### User Account
```
GET    /api/v1/user/profile                      Profile details
PUT    /api/v1/user/profile                      Update profile
GET    /api/v1/user/bookings                     All bookings
GET    /api/v1/user/invoices                     Download invoices
```

---

## 4. Authentication & Authorization

### JWT Token Structure

```javascript
// Access Token (15 minutes)
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "USER|HOTEL_VENDOR|FLIGHT_VENDOR|ADMIN",
  "vendor_id": "hotel_vendor_id", // optional
  "permissions": ["read:hotels", "create:booking"],
  "iat": 1234567890,
  "exp": 1234567900
}

// Refresh Token (7 days) - stored in httpOnly cookie
{
  "sub": "user_id",
  "type": "refresh",
  "iat": 1234567890,
  "exp": 1234567890
}
```

### Role-Based Access Control (RBAC)

```javascript
const rolePermissions = {
  ADMIN: [
    'manage:vendors',
    'manage:hotels',
    'manage:airlines',
    'view:all_bookings',
    'manage:payments',
    'view:analytics'
  ],
  HOTEL_VENDOR: [
    'manage:own_hotel',
    'manage:own_rooms',
    'view:own_bookings',
    'manage:own_bookings',
    'view:own_analytics'
  ],
  FLIGHT_VENDOR: [
    'manage:own_airline',
    'manage:own_routes',
    'view:own_bookings',
    'manage:own_bookings',
    'view:own_analytics'
  ],
  USER: [
    'search:hotels',
    'search:flights',
    'create:booking',
    'view:own_bookings',
    'cancel:own_bookings',
    'make:payment'
  ]
};
```

---

## 5. Folder Structure

```
makemytrip-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection
│   │   ├── redis.js             # Redis client
│   │   ├── s3.js                # AWS S3 config
│   │   ├── email.js             # SendGrid config
│   │   └── payment.js           # Razorpay config
│   │
│   ├── middleware/
│   │   ├── auth.js              # JWT verification
│   │   ├── rbac.js              # Role-based access
│   │   ├── errorHandler.js      # Error handling
│   │   ├── requestLogger.js     # Request logging
│   │   ├── rateLimiter.js       # Rate limiting
│   │   └── validation.js        # Input validation
│   │
│   ├── routes/
│   │   ├── auth.js              # Auth endpoints
│   │   ├── admin/
│   │   │   ├── vendors.js       # Vendor management
│   │   │   ├── hotels.js        # Hotel management
│   │   │   ├── bookings.js      # Booking management
│   │   │   └── analytics.js     # Dashboard analytics
│   │   ├── vendor/
│   │   │   ├── hotels.js        # Hotel vendor endpoints
│   │   │   ├── airlines.js      # Airline vendor endpoints
│   │   │   └── bookings.js      # Vendor booking management
│   │   └── user/
│   │       ├── hotels.js        # User hotel search/booking
│   │       ├── flights.js       # User flight search/booking
│   │       ├── payments.js      # Payment endpoints
│   │       └── profile.js       # User account
│   │
│   ├── controllers/
│   │   ├── auth/
│   │   │   └── authController.js
│   │   ├── admin/
│   │   │   ├── vendorController.js
│   │   │   ├── hotelController.js
│   │   │   ├── bookingController.js
│   │   │   └── analyticsController.js
│   │   ├── vendor/
│   │   │   ├── hotelController.js
│   │   │   ├── roomController.js
│   │   │   ├── airlineController.js
│   │   │   ├── routeController.js
│   │   │   └── vendorBookingController.js
│   │   └── user/
│   │       ├── hotelController.js
│   │       ├── flightController.js
│   │       ├── bookingController.js
│   │       └── paymentController.js
│   │
│   ├── services/
│   │   ├── auth/
│   │   │   ├── authService.js
│   │   │   ├── jwtService.js
│   │   │   └── passwordService.js
│   │   ├── hotel/
│   │   │   ├── hotelService.js
│   │   │   ├── roomService.js
│   │   │   ├── availabilityService.js
│   │   │   └── bookingService.js
│   │   ├── flight/
│   │   │   ├── airlineService.js
│   │   │   ├── routeService.js
│   │   │   ├── seatService.js
│   │   │   └── flightBookingService.js
│   │   ├── payment/
│   │   │   ├── razorpayService.js
│   │   │   ├── stripeService.js
│   │   │   └── paymentService.js
│   │   ├── notification/
│   │   │   ├── emailService.js
│   │   │   ├── smsService.js
│   │   │   └── notificationQueue.js
│   │   ├── invoice/
│   │   │   ├── invoiceGenerator.js
│   │   │   └── pdfService.js
│   │   ├── analytics/
│   │   │   ├── hotelAnalytics.js
│   │   │   ├── flightAnalytics.js
│   │   │   └── revenueAnalytics.js
│   │   └── storage/
│   │       └── s3Service.js
│   │
│   ├── models/
│   │   └── index.js             # All Sequelize/Prisma models
│   │
│   ├── utils/
│   │   ├── logger.js            # Winston logger
│   │   ├── errorCodes.js        # Error definitions
│   │   ├── validators.js        # Validation functions
│   │   ├── helpers.js           # Utility functions
│   │   ├── enums.js             # Status enums
│   │   └── constants.js         # Constants
│   │
│   ├── jobs/
│   │   ├── emailJobs.js         # Send credential emails
│   │   ├── invoiceJobs.js       # Generate invoices
│   │   └── analyticsJobs.js     # Update analytics
│   │
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   │
│   └── index.js                 # App entry point
│
├── .env
├── .env.example
├── package.json
└── README.md
```

---

## 6. Security Best Practices

### Authentication & Authorization
- ✓ JWT with short expiration (15 min access, 7 day refresh)
- ✓ Refresh tokens in httpOnly cookies (CSRF protection)
- ✓ Password hashing with bcrypt (salt rounds ≥ 12)
- ✓ Email verification before account activation
- ✓ Rate limiting on auth endpoints (5 attempts/15 min)
- ✓ Two-factor authentication (optional for admin)

### API Security
- ✓ CORS restricted to frontend domain only
- ✓ HTTPS enforced (TLS 1.2+)
- ✓ API versioning for backward compatibility
- ✓ Request validation on all endpoints
- ✓ Rate limiting (100 req/min per IP, higher for authenticated)
- ✓ Input sanitization (SQL injection, XSS prevention)
- ✓ CSRF tokens for state-changing operations

### Database Security
- ✓ Parameterized queries (ORM prevents SQL injection)
- ✓ Row-level security for multi-tenant data
- ✓ Encryption for sensitive fields (email, phone)
- ✓ Database user with minimal privileges
- ✓ Automated backups (daily)
- ✓ Audit logging for critical operations

### File Upload Security
- ✓ File type validation (images only)
- ✓ File size limits (max 10MB per image)
- ✓ Virus scanning on upload
- ✓ Store in S3, not server disk
- ✓ CloudFront with signed URLs for delivery

### Payment Security
- ✓ Never store card data (use Razorpay/Stripe)
- ✓ PCI-DSS compliance
- ✓ Payment verification on server side
- ✓ Webhook signature validation
- ✓ Idempotent payment endpoints

### Data Privacy
- ✓ Encrypt PII at rest (AES-256)
- ✓ GDPR compliance (right to be forgotten)
- ✓ Data retention policies
- ✓ Audit trails for data access
- ✓ Minimal data collection principle

---

## 7. Key Implementation Patterns

### 1. Availability Management (Hotel Rooms)

```javascript
// Atomic availability check and decrement
async function bookRoom(roomId, checkInDate, checkOutDate, numRooms) {
  const result = await db.sequelize.transaction(async (transaction) => {
    // 1. Lock the room row
    const room = await Room.findByPk(roomId, { 
      lock: transaction.LOCK.UPDATE,
      transaction 
    });

    // 2. Check availability
    if (room.availableRooms < numRooms) {
      throw new Error('Insufficient rooms available');
    }

    // 3. Create booking
    const booking = await HotelBooking.create({
      roomId,
      checkInDate,
      checkOutDate,
      numberOfRooms: numRooms,
      status: 'CONFIRMED'
    }, { transaction });

    // 4. Decrement availability atomically
    await room.decrement('availableRooms', {
      by: numRooms,
      transaction
    });

    return booking;
  });

  return result;
}
```

### 2. Email Service with Queue

```javascript
// Bull job queue for sending emails
const emailQueue = new Queue('emails', {
  redis: { host: process.env.REDIS_HOST, port: process.env.REDIS_PORT }
});

async function sendCredentialsEmail(vendorId, email, temporaryPassword) {
  await emailQueue.add({
    vendorId,
    email,
    temporaryPassword,
    template: 'VENDOR_CREDENTIALS'
  }, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: true
  });
}

emailQueue.process(async (job) => {
  const { email, temporaryPassword, template } = job.data;
  
  const html = generateEmailTemplate(template, { email, temporaryPassword });
  
  await sendgrid.send({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Your Login Credentials',
    html
  });
});
```

### 3. Invoice Generation

```javascript
async function generateInvoice(bookingId, bookingType) {
  let booking, vendor;

  if (bookingType === 'HOTEL') {
    booking = await HotelBooking.findByPk(bookingId, {
      include: ['Hotel', 'Room', 'User']
    });
  } else {
    booking = await FlightBooking.findByPk(bookingId, {
      include: ['Route', 'Airline', 'User']
    });
  }

  // Generate PDF using PDFKit or similar
  const pdfBuffer = await generatePdf({
    invoiceNumber: booking.id,
    date: new Date(),
    customer: booking.user.name,
    items: bookingType === 'HOTEL' 
      ? [{ description: `${booking.room.categoryName} - ${booking.numberOfRooms} room(s)`, amount: booking.basePrice }]
      : [{ description: `Flight ${booking.route.flightCode}`, amount: booking.basePrice }],
    tax: booking.taxesFees,
    total: booking.totalPrice
  });

  // Upload to S3
  const key = `invoices/${bookingType.toLowerCase()}-${bookingId}.pdf`;
  const url = await s3Service.uploadFile(pdfBuffer, key, 'application/pdf');

  // Store invoice record
  await Invoice.create({
    bookingType,
    bookingId,
    userId: booking.userId,
    amount: booking.basePrice,
    taxAmount: booking.taxesFees,
    totalAmount: booking.totalPrice,
    pdfUrl: url,
    status: 'SENT'
  });

  return url;
}
```

### 4. Search with Caching

```javascript
async function searchHotels(filters) {
  // Generate cache key
  const cacheKey = `hotels:search:${JSON.stringify(filters)}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Database query
  const hotels = await Hotel.findAll({
    where: {
      city: filters.city,
      isActive: true,
      isVerified: true
    },
    include: [{
      association: 'rooms',
      where: {
        availableRooms: { [Op.gt]: 0 },
        isActive: true
      },
      attributes: ['id', 'categoryName', 'basePrice', 'availableRooms']
    }],
    limit: filters.limit || 20,
    offset: filters.offset || 0
  });

  // Cache for 1 hour
  await redis.setex(cacheKey, 3600, JSON.stringify(hotels));

  return hotels;
}
```

---

## 8. Scalability Considerations

### Database
- **Replication**: Primary-replica setup for read scaling
- **Partitioning**: Shard bookings by date/region
- **Indexing**: Composite indexes on frequent queries (city, date, status)
- **Query optimization**: N+1 prevention with eager loading

### Caching Strategy
- **Redis Clusters**: For high availability
- **Cache layers**: 
  - Session cache (Redis)
  - Search results (Redis, 1 hour TTL)
  - Hotel/room details (Redis, 24 hour TTL)
  - Static content (CDN)

### API Gateway
- **Load balancing**: Round-robin, health checks
- **Rate limiting**: Token bucket algorithm
- **Request queuing**: Fair queueing for high load
- **Timeout management**: 30 sec request timeout

### Async Processing
- **Message queue**: Bull + Redis for reliability
- **Job workers**: Multiple workers for email, invoices, analytics
- **Dead letter queue**: Failed jobs retained 7 days

### Monitoring
- **Metrics**: Prometheus (requests, latency, errors)
- **Logs**: ELK Stack (centralized logging)
- **Alerts**: Datadog (performance degradation, errors)
- **APM**: New Relic (transaction tracing)

---

## 9. Deployment Architecture

```
┌─────────────────────────────────────────────┐
│         CloudFlare / AWS CloudFront          │
│         (CDN + DDoS Protection)              │
└────────────────────┬────────────────────────┘
                     │
┌────────────────────▼────────────────────────┐
│         AWS Application Load Balancer        │
│         (SSL/TLS, Health Checks)             │
└────────────────┬───────────────┬────────────┘
                 │               │
    ┌────────────▼──┐  ┌─────────▼────────┐
    │ ECS Fargate    │  │ ECS Fargate      │
    │ (API Cluster)  │  │ (Job Workers)    │
    │ - 3+ instances │  │ - 2+ instances   │
    └────────────────┘  └──────────────────┘
                 │
    ┌────────────┼──────────────┬────────────┐
    │            │              │            │
    ▼            ▼              ▼            ▼
  RDS        ElastiCache    S3          SQS/SNS
(PostgreSQL) (Redis)      (Images)    (Queues)
```

---

## 10. Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-3)
- [ ] Database schema setup
- [ ] Authentication service
- [ ] JWT middleware
- [ ] Admin vendor registration APIs
- [ ] Email service integration

### Phase 2: Hotel Module (Weeks 4-6)
- [ ] Hotel vendor dashboard
- [ ] Room management
- [ ] Availability tracking
- [ ] Hotel booking flow
- [ ] Payment integration

### Phase 3: Flight Module (Weeks 7-9)
- [ ] Airline vendor dashboard
- [ ] Route management
- [ ] Seat inventory
- [ ] Flight booking flow
- [ ] Ticket generation

### Phase 4: Advanced Features (Weeks 10-12)
- [ ] Analytics & reporting
- [ ] Invoice generation
- [ ] Refund processing
- [ ] Multi-currency support
- [ ] Admin controls

### Phase 5: Optimization & DevOps (Weeks 13-16)
- [ ] Performance optimization
- [ ] Caching strategy
- [ ] Load testing
- [ ] Docker containerization
- [ ] CI/CD pipeline

---

## 11. Sample Response Objects

### Hotel Search Response
```json
{
  "success": true,
  "data": {
    "hotels": [
      {
        "id": 1,
        "name": "Taj Hotel",
        "city": "Mumbai",
        "rating": 4.5,
        "amenities": ["WiFi", "Pool", "Gym"],
        "image": "https://cdn.example.com/hotel-1.jpg",
        "pricePerNight": 150,
        "availableRooms": 5,
        "rooms": [
          {
            "id": 101,
            "categoryName": "Deluxe",
            "capacity": 2,
            "price": 150,
            "amenities": ["AC", "WiFi", "TV"]
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45
    }
  }
}
```

### Booking Response
```json
{
  "success": true,
  "data": {
    "bookingId": "HB20250519001",
    "status": "CONFIRMED",
    "totalPrice": 1500,
    "paymentStatus": "PENDING",
    "paymentUrl": "https://razorpay.com/checkout/...",
    "checkInDate": "2025-06-01",
    "checkOutDate": "2025-06-05",
    "hotel": {
      "name": "Taj Hotel",
      "address": "Mumbai, India"
    }
  }
}
```

---

This comprehensive design provides enterprise-grade architecture for a scalable hotel and flight booking system. Each section can be implemented incrementally following the roadmap.
