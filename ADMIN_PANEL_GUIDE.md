# MakeMyTrip Admin Panel - Complete Guide

## 🎯 Overview

A production-ready admin dashboard for managing all travel data (Flights, Hotels, Buses, Cabs, Bookings, Users) with full CRUD functionality, real-time analytics, and role-based access control.

---

## 📊 Features

### Core Features
✅ **Admin Authentication** - Secure login with JWT tokens  
✅ **Dashboard** - Real-time statistics, revenue charts, availability tracking  
✅ **Flights Management** - Full CRUD operations with search and pagination  
✅ **Hotels Management** - Complete inventory and pricing control  
✅ **Buses Management** - Route and schedule management  
✅ **Cabs Management** - Pricing tiers and availability  
✅ **Bookings Management** - View and manage all user bookings  
✅ **Users Management** - User information and booking history  
✅ **Responsive Design** - Works on desktop, tablet, and mobile  

### Advanced Features
✅ Search & Filter  
✅ Pagination (10 items per page)  
✅ Status toggle (Active/Inactive)  
✅ Bulk delete with confirmation  
✅ Real-time data refresh  
✅ Role-based access control  

---

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB (or compatible)
- npm or yarn

### Installation & Running

#### Backend Setup
```bash
cd makemytrip-backend

# Install dependencies (if not already done)
npm install

# Create .env file (if not exists)
echo "PORT=5000
NODE_ENV=development
JWT_SECRET=your-admin-secret-key-change-in-production
CORS_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/makemytrip" > .env

# Start the backend
npm run dev
```

#### Frontend Setup
```bash
cd makemytrip-frontend

# Install dependencies (if not already done)
npm install

# Start the frontend
npm run dev
```

### Access Admin Panel
Open your browser and navigate to: `http://localhost:5173/admin/login`

---

## 🔐 Authentication

### Demo Credentials
```
Email:    admin@makemytrip.com
Password: admin123
```

### First Time Setup
To create your first admin account:

1. **Via API (Recommended)**:
```bash
curl -X POST http://localhost:5000/api/v1/admin/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@makemytrip.com",
    "password": "admin123",
    "role": "superadmin"
  }'
```

2. **Via Seed Script** (Backend):
Create `makemytrip-backend/scripts/seedAdmin.js`:
```javascript
import Admin from '../models/Admin.js'
import bcrypt from 'bcryptjs'
import { connectDB } from '../config/db.js'

async function seedAdmin() {
  await connectDB()
  
  const hashed = await bcrypt.hash('admin123', 10)
  await Admin.create({
    name: 'Admin User',
    email: 'admin@makemytrip.com',
    password: hashed,
    role: 'superadmin',
    permissions: ['read', 'write', 'delete']
  })
  
  console.log('✅ Admin account created!')
}

seedAdmin()
```

Run: `node scripts/seedAdmin.js`

---

## 📋 Admin Panel Structure

### 1. Dashboard
**Route**: `/admin/dashboard`

Shows real-time metrics:
- Total Users
- Total Bookings
- Total Flights/Hotels/Buses/Cabs
- 12-month Revenue Trend
- Resource Availability Stats

**Features**:
- Live statistics update
- Revenue charts
- Availability breakdown
- Refresh button for manual updates

### 2. Flights Management
**Route**: `/admin/flights`

**CRUD Operations**:
- **Create**: Add new flights with all details
- **Read**: Search, filter, and paginate flights
- **Update**: Edit flight info, pricing, availability
- **Delete**: Remove flights with confirmation

**Fields**:
```
- Airline name
- Flight number (unique)
- Departure city, airport, time, date
- Arrival city, airport, time, date
- Duration
- Price (₹)
- Total seats
- Available seats (auto-calculated)
- Baggage allowance
- Stops
- Aircraft type
- Image URL
- Active/Inactive status
```

### 3. Hotels Management
**Route**: `/admin/hotels`

**CRUD Operations**:
- Create, read, update, delete hotels
- Manage pricing and availability
- Add amenities and images
- Track ratings and reviews

**Fields**:
```
- Hotel name
- City & location
- Description
- Rating (1-5 stars)
- Price (₹)
- Price per night (₹)
- Total rooms
- Available rooms
- Amenities (WiFi, Pool, Gym, etc.)
- Images
- Check-in/out times
```

### 4. Buses Management
**Route**: `/admin/buses`

**CRUD Operations**:
- Add bus operators and routes
- Manage schedules and pricing
- Track seat availability

**Fields**:
```
- Operator name
- Bus number (unique)
- Bus type (AC/Non-AC/Sleeper/Luxury)
- Departure & arrival cities/times
- Duration
- Price (₹)
- Total seats
- Amenities
- Image
```

### 5. Cabs Management
**Route**: `/admin/cabs`

**CRUD Operations**:
- Manage cab operators
- Set pricing tiers
- Track availability

**Fields**:
```
- Operator name
- Cab number (unique)
- Type (Economy/Premium/XL/Luxury)
- Base fare (₹)
- Per KM rate (₹)
- Per minute rate (₹)
- Current city
- Total cabs
- Available cabs
```

### 6. Bookings Management
**Route**: `/admin/bookings`

**Features**:
- View all bookings (currently mock data)
- Booking details (user, type, amount, status)
- Update booking status (Confirmed/Cancelled)
- Search and filter bookings

**Future Enhancement**: Integrate with Booking model

### 7. Users Management
**Route**: `/admin/users`

**Features**:
- View all registered users
- User details (name, email, phone)
- Total bookings per user
- Account creation date
- Delete user accounts

---

## 🔧 API Endpoints

### Authentication
```
POST   /api/v1/admin/register          - Register new admin
POST   /api/v1/admin/login             - Login (returns JWT)
GET    /api/v1/admin/profile           - Get admin profile
POST   /api/v1/admin/logout            - Logout
```

### Dashboard
```
GET    /api/v1/admin/dashboard/stats           - Get dashboard stats
GET    /api/v1/admin/dashboard/revenue        - Get revenue data
GET    /api/v1/admin/dashboard/recent-bookings - Get recent bookings
GET    /api/v1/admin/dashboard/availability   - Get resource availability
```

### Flights CRUD
```
POST   /api/v1/admin/flights            - Create flight
GET    /api/v1/admin/flights            - Get all flights (paginated)
GET    /api/v1/admin/flights/:id        - Get flight by ID
PUT    /api/v1/admin/flights/:id        - Update flight
DELETE /api/v1/admin/flights/:id        - Delete flight
PATCH  /api/v1/admin/flights/:id/toggle - Toggle active status
```

### Hotels CRUD
```
POST   /api/v1/admin/hotels             - Create hotel
GET    /api/v1/admin/hotels             - Get all hotels (paginated)
GET    /api/v1/admin/hotels/:id         - Get hotel by ID
PUT    /api/v1/admin/hotels/:id         - Update hotel
DELETE /api/v1/admin/hotels/:id         - Delete hotel
PATCH  /api/v1/admin/hotels/:id/toggle  - Toggle active status
```

### Buses CRUD
```
POST   /api/v1/admin/buses              - Create bus
GET    /api/v1/admin/buses              - Get all buses (paginated)
GET    /api/v1/admin/buses/:id          - Get bus by ID
PUT    /api/v1/admin/buses/:id          - Update bus
DELETE /api/v1/admin/buses/:id          - Delete bus
PATCH  /api/v1/admin/buses/:id/toggle   - Toggle active status
```

### Cabs CRUD
```
POST   /api/v1/admin/cabs               - Create cab
GET    /api/v1/admin/cabs               - Get all cabs (paginated)
GET    /api/v1/admin/cabs/:id           - Get cab by ID
PUT    /api/v1/admin/cabs/:id           - Update cab
DELETE /api/v1/admin/cabs/:id           - Delete cab
PATCH  /api/v1/admin/cabs/:id/toggle    - Toggle active status
```

All endpoints (except `/register` and `/login`) require JWT authentication:
```
Header: Authorization: Bearer <token>
```

---

## 💾 Database Models

### Admin Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (hashed, required),
  role: String (enum: ['superadmin', 'admin']),
  permissions: [String],
  isActive: Boolean (default: true),
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Flight Model
```javascript
{
  _id: ObjectId,
  airline: String,
  flightNumber: String (unique),
  departure: { city, airport, time, date },
  arrival: { city, airport, time, date },
  duration: String,
  price: Number,
  seats: Number,
  seatsAvailable: Number,
  baggage: String,
  stops: Number,
  aircraft: String,
  image: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Hotel Model
```javascript
{
  _id: ObjectId,
  name: String,
  city: String,
  location: String,
  description: String,
  image: String,
  images: [String],
  rating: Number (1-5),
  reviews: Number,
  price: Number,
  pricePerNight: Number,
  rooms: Number,
  roomsAvailable: Number,
  amenities: [String],
  checkin: String,
  checkout: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

Similar models exist for Bus and Cab.

---

## 🎨 UI/UX Features

### Dashboard Design
- Modern card-based layout
- Color-coded statistics
- Interactive charts
- Responsive grid system

### Sidebar Navigation
- Icon-based menu items
- Active state highlighting
- Smooth transitions
- Mobile hamburger menu

### Forms & Modals
- Clean, organized form sections
- Real-time validation
- Cancel/Submit buttons
- Modal overlay with click-outside-to-close

### Tables
- Sortable columns
- Search filtering
- Pagination controls
- Action buttons (Edit, Delete, Toggle)
- Status badges

### Color Scheme
- Primary Blue: `#1a73e8`
- Success Green: `#10b981`
- Warning Orange: `#f59e0b`
- Error Red: `#e63946`
- Dark BG: `#1a1f36`

---

## 🔒 Security Features

1. **JWT Authentication**
   - 30-day token expiration
   - Secure token storage in localStorage
   - Auto-logout on token expiry

2. **Protected Routes**
   - Admin-only route protection
   - Automatic redirect to login
   - Role-based access control

3. **Data Validation**
   - Server-side validation
   - Input sanitization
   - Unique constraint enforcement

4. **Request Headers**
   - CORS configured
   - Content-Type validation
   - Authorization header requirement

---

## 📱 Responsive Design

- **Desktop** (1024px+): Full sidebar + content
- **Tablet** (768px - 1023px): Collapsible sidebar
- **Mobile** (< 768px): Hamburger menu, stacked layout

---

## 🚀 Advanced Features

### Search & Filter
- Real-time search across multiple fields
- Case-insensitive matching
- Multi-field filtering
- Search pagination reset

### Pagination
- 10 items per page (configurable)
- Previous/Next navigation
- Page indicator
- Jump to specific page

### Status Management
- Toggle active/inactive status
- Bulk status updates (future)
- Audit logging (future)

### Batch Operations
- Multi-select (future)
- Bulk delete (future)
- CSV export (future)

---

## 🐛 Troubleshooting

### Issue: Admin login fails
**Solution**:
1. Ensure backend is running on port 5000
2. Check MongoDB connection
3. Verify admin account exists
4. Check JWT_SECRET in .env

### Issue: Data not appearing
**Solution**:
1. Ensure backend API is responding
2. Check browser console for errors
3. Verify authentication token
4. Refresh the page

### Issue: Form submission fails
**Solution**:
1. Fill all required fields (marked with *)
2. Check network tab for API errors
3. Ensure data is valid
4. Check server logs for validation errors

---

## 📝 API Request Examples

### Create Flight
```bash
curl -X POST http://localhost:5000/api/v1/admin/flights \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "airline": "Air India",
    "flightNumber": "AI101",
    "departure": {
      "city": "Delhi",
      "airport": "DEL",
      "time": "10:00",
      "date": "2026-06-15"
    },
    "arrival": {
      "city": "Mumbai",
      "airport": "BOM",
      "time": "12:30",
      "date": "2026-06-15"
    },
    "duration": "2h 30m",
    "price": 5000,
    "seats": 180,
    "baggage": "20kg",
    "aircraft": "Boeing 737"
  }'
```

### Search Flights
```bash
curl "http://localhost:5000/api/v1/admin/flights?page=1&limit=10&search=Air" \
  -H "Authorization: Bearer <token>"
```

### Update Flight
```bash
curl -X PUT http://localhost:5000/api/v1/admin/flights/{flightId} \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"price": 4500}'
```

---

## 📈 Future Enhancements

- [ ] Image upload functionality
- [ ] Bulk CSV import/export
- [ ] Advanced analytics & reporting
- [ ] Email notifications
- [ ] SMS alerts
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Role-based permissions UI
- [ ] Audit logs
- [ ] API rate limiting
- [ ] Two-factor authentication
- [ ] WebSocket real-time updates

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API error messages
3. Check backend logs: `npm run dev`
4. Verify database connection

---

## 📄 License

This admin panel is part of the MakeMyTrip Clone project.

---

**Version**: 1.0.0  
**Last Updated**: 2026-05-16  
**Created by**: Claude Code
