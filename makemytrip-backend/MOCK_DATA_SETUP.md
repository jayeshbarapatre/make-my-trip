# Mock Data Solution - Complete Setup

## Overview
The backend now has a complete mock data solution that allows full testing of the booking flow WITHOUT any database connection. Users can immediately test:
- User registration & login
- Flight/Hotel/Bus/Train/Cab search
- Complete booking workflow
- My Trips viewing
- PDF ticket generation
- Payment flows

## Files Created

### 1. `/src/services/mockData.js`
- **Purpose**: Central repository of realistic mock data
- **Contents**: 
  - 10 flights with enriched fields (airline, times, pricing, amenities)
  - 10 hotels with ratings, images, amenities
  - 10 buses with operator details and pricing
  - 10 trains with classes and seat info
  - 10 cabs with provider pricing models
- **Key Features**:
  - Realistic pricing with breakdowns (baseFare, taxes, GST)
  - Detailed times and routes (Delhi↔Mumbai, Bangalore↔Delhi, etc.)
  - Rich amenities, ratings, and reviews
  - Proper seat/room availability tracking

### 2. `/src/middleware/useMockData.js`
- **Purpose**: Middleware that intercepts database calls and returns mock data
- **Features**:
  - `createMockPrismaClient()` - Returns a mock Prisma-compatible client
  - In-memory storage for bookings, users, and OTPs created during session
  - Supports all Prisma operations: findUnique, findMany, create, update, delete, count
  - Proper filtering, ordering, and pagination
  - `mockDataMiddleware` - Express middleware to attach mock client to requests

### 3. Updated Controllers (to use mock data)
Modified to use `const db = req.mockPrisma || prisma`:
- `authController.js` - User registration, login, OTP verification
- `bookingController.js` - Create/retrieve/cancel bookings
- `flightController.js` - Flight CRUD operations
- `hotelController.js` - Hotel search and details
- `busController.js` - Bus search
- `trainController.js` - Train search
- `userController.js` - Already compatible (uses prisma from config)

### 4. Updated Core Files

#### `/src/config/prismaClient.js`
```javascript
// Automatically uses mock data when USE_MOCK_DATA=true
if (process.env.USE_MOCK_DATA === 'true') {
  prisma = createMockPrismaClient()
} else {
  prisma = new PrismaClient()
}
```

#### `/src/index.js`
- Added mock data middleware import
- Registered middleware on app before routes
- Updated /health endpoint to show `mockDataEnabled` status

#### `/.env`
```
USE_MOCK_DATA=true
```

## How It Works

### Flow When Mock Mode is Enabled:
1. **Startup**: `index.js` loads and registers mockDataMiddleware
2. **Config**: `prismaClient.js` checks `USE_MOCK_DATA` env var
   - If true: Uses mock client
   - If false: Connects to real database
3. **Request**: Middleware attaches mock client to `req.mockPrisma`
4. **Controllers**: Use `db = req.mockPrisma || prisma`
   - Gets mock client from request if available
   - Falls back to imported prisma (also mock if enabled globally)
5. **Response**: Mock data returned with realistic content

### Data Persistence During Session:
- **Static data** (flights, hotels, buses, trains, cabs): Read from mockData.js
- **Dynamic data** (bookings, users): Stored in memory arrays
  - `mockBookings[]` - Created bookings
  - `mockUsers[]` - Registered users
  - `otpStore{}` - OTPs for verification

All data resets when server restarts.

## Testing Workflow

### 1. Start Backend
```bash
cd makemytrip-backend
npm run dev
```

**Expected Output:**
```
🎭 MOCK DATA MODE ENABLED - Using in-memory mock database
Server running on http://localhost:5000
✅ Health check with mockDataEnabled: true
```

### 2. Register User
```bash
POST /api/v1/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210"
}
```

### 3. Search Flights
```bash
GET /api/v1/flights?from=Delhi&to=Mumbai&date=2026-07-25&passengers=2
```

**Returns**: 10 mock flights with realistic pricing and details

### 4. Book Flight
```bash
POST /api/v1/bookings/flights
{
  "type": "flight",
  "flightId": "FL-001",
  "fromCity": "Delhi",
  "toCity": "Mumbai",
  "departureDate": "2026-07-25",
  "travellers": [...],
  "totalAmount": 6998,
  ...
}
```

### 5. View My Bookings
```bash
GET /api/v1/bookings (with auth token)
```

**Returns**: All user's bookings stored in mock memory

## Available Mock Data Routes

### Flights
- `GET /api/v1/flights?from=Delhi&to=Mumbai` - Search
- `GET /api/v1/flights/:id` - Details
- `POST /api/v1/flights` - Create (admin)

### Hotels  
- `GET /api/v1/hotels?city=Delhi` - Search
- `GET /api/v1/hotels/:id` - Details

### Buses
- `GET /api/v1/buses?from=Delhi&to=Mumbai` - Search
- `GET /api/v1/buses/:id` - Details

### Trains
- `GET /api/v1/trains?from=Delhi&to=Mumbai` - Search
- `GET /api/v1/trains/:id` - Details

### Cabs
- `GET /api/v1/cabs` - Search/list
- `GET /api/v1/cabs/:id` - Details

### Bookings
- `POST /api/v1/bookings/flights` - Book flight
- `POST /api/v1/bookings/hotels` - Book hotel
- `POST /api/v1/bookings/buses` - Book bus
- `POST /api/v1/bookings/trains` - Book train
- `POST /api/v1/bookings/cabs` - Book cab
- `GET /api/v1/bookings` - User's bookings
- `GET /api/v1/bookings/:id` - Booking details
- `PUT /api/v1/bookings/:id/cancel` - Cancel booking

### Auth
- `POST /api/v1/auth/register` - User signup
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/send-otp` - Send OTP via phone
- `POST /api/v1/auth/verify-otp` - Verify OTP
- `GET /api/v1/auth/profile` - Get user profile (auth required)

## Disabling Mock Mode

To use real database instead:

### Option 1: Change .env
```env
USE_MOCK_DATA=false
```

### Option 2: Remove line from .env
The system defaults to database when `USE_MOCK_DATA` is not set or false.

## Mock Data Characteristics

### Flights (10 total)
- Routes: Delhi↔Mumbai, Bangalore↔Delhi
- Airlines: IndiGo, Air India, SpiceJet, Vistara, GoAir, Air India Express
- Prices: ₹2,599 - ₹4,899
- Classes: Economy, Premium Economy, Business
- Amenities: WiFi, Meals, USB Charging, Premium Lounge Access

### Hotels (10 total)
- Cities: Delhi (5), Mumbai (3), Bangalore (2)
- Star ratings: 3★ to 5★ (Iconic)
- Prices: ₹4,999 - ₹14,999 per night
- Amenities: WiFi, Pool, Spa, Gym, Fine Dining
- Rooms Available: 3-30 per hotel

### Buses (10 total)
- Routes: Delhi↔Jaipur, Mumbai↔Pune, Bangalore↔Hyderabad
- Types: AC/Non-AC, Sleeper/Recliner, Luxury
- Prices: ₹399 - ₹799
- Operators: Redbus Express, Volvo, Sky Bus, Shatabdi
- Seats: 32-48 per bus

### Trains (10 total)
- Routes: Delhi↔Mumbai, Delhi↔Bangalore, Hyderabad↔Bangalore
- Classes: 1AC, 2AC, 3AC, Chair Car
- Prices: ₹399 - ₹2,099
- Amenities: Meals, Bedroll, Charging, Lounge Access

### Cabs (10 total)
- Providers: Uber, Ola, Rapido
- Types: UberGo, Ola Prime, XL, Auto
- Routes: Delhi↔Noida, Mumbai↔Pune
- Prices: ₹150 - ₹520 per trip
- Features: WiFi, Power Bank, Water, USB Charging

## Key Benefits

✅ **Zero Database Setup** - No MongoDB/PostgreSQL needed
✅ **Instant Start** - Works immediately after `npm run dev`
✅ **Full Testing** - Complete booking flow testable
✅ **Realistic Data** - Proper pricing, times, amenities
✅ **Session Persistence** - Bookings saved during session
✅ **Easy Toggle** - Single env var to switch to real DB
✅ **No Code Changes** - All controllers work with both mock and real data
✅ **Development Friendly** - Fast testing without network calls

## Limitations

- ❌ Data resets on server restart
- ❌ Only one session at a time (data not shared across servers)
- ❌ No persistence across deploys
- ❌ Mock data is fixed (no dynamic updates)

**These limitations are expected for development/demo purposes.**

## Production Usage

For production, disable mock mode and use real database:
```env
USE_MOCK_DATA=false
MONGODB_URI=mongodb+srv://...
```

## Support

For any issues:
1. Check `USE_MOCK_DATA=true` in .env
2. Ensure backend is restarted after changing .env
3. Check console logs for 🎭 emoji (indicates mock mode active)
4. Clear browser localStorage and retry auth
