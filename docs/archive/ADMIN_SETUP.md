# ⚡ Admin Panel Setup Guide - Quick Start

## 🎯 5-Minute Setup

### Step 1: Create Admin Account (Backend)

```bash
# Navigate to backend
cd makemytrip-backend

# Run seed script to create demo admin
node scripts/seedAdmin.js
```

**Output:**
```
✅ Admin account created successfully!
📧 Email: admin@makemytrip.com
🔐 Password: admin123
👤 Role: superadmin
🌐 Access at: http://localhost:5173/admin/login
```

### Step 2: Start Backend

```bash
# In makemytrip-backend directory
npm run dev
# Should see: Server running on http://localhost:5000
```

### Step 3: Start Frontend

```bash
# In a new terminal, navigate to frontend
cd makemytrip-frontend

npm run dev
# Should see: VITE v4.x.x  ready in xxx ms
```

### Step 4: Login to Admin Panel

1. Open browser: `http://localhost:5173/admin/login`
2. Email: `admin@makemytrip.com`
3. Password: `admin123`
4. Click **Login to Admin Panel**

✅ **You're in!** Welcome to the admin dashboard!

---

## 📊 What You Can Do Now

### 🛫 Manage Flights
- **Add New Flight**: Click "✈️ Add New Flight" button
- **Edit Flight**: Click "✎ Edit" on any flight
- **Delete Flight**: Click "🗑️ Delete" (confirm deletion)
- **Search**: Use search bar to filter flights
- **Toggle Status**: Click "🔒/🔓" to activate/deactivate

### 🏨 Manage Hotels
- Same CRUD operations as Flights
- Add amenities (WiFi, Pool, Gym, etc.)
- Set star ratings
- Track room availability

### 🚌 Manage Buses
- Add bus operators and routes
- Manage schedules
- Set pricing and seat availability
- Track amenities (WiFi, Power outlets, etc.)

### 🚕 Manage Cabs
- Add cab operators
- Set dynamic pricing (base fare + per KM + per minute)
- Track available cabs
- Manage different cab types

### 📋 View Bookings
- See all user bookings
- View booking status
- Update booking status
- Search by user or date

### 👥 View Users
- See all registered users
- View user details
- Track booking history
- Manage user accounts

---

## 📈 Dashboard Overview

The dashboard shows:
- **Total Users**: All registered users
- **Total Bookings**: Complete booking count
- **Total Resources**: Flights, Hotels, Buses, Cabs counts
- **12-Month Revenue Chart**: Visual revenue trend
- **Resource Availability**: Real-time seat/room availability percentages

---

## 🔐 Security

Your admin token is stored in browser localStorage and will:
- Automatically refresh when expired
- Be used for all API requests
- Be cleared on logout

**⚠️ Important**: Change the default password in production!

```bash
# Change JWT_SECRET in .env
JWT_SECRET=your-very-secure-secret-key-change-this
```

---

## 🗂️ File Structure

```
makemytrip-frontend/
├── src/
│   ├── pages/
│   │   ├── AdminLoginPage.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── AdminFlights.jsx
│   │   ├── AdminHotels.jsx
│   │   ├── AdminBuses.jsx
│   │   ├── AdminCabs.jsx
│   │   ├── AdminBookings.jsx
│   │   └── AdminUsers.jsx
│   ├── components/Admin/
│   │   ├── AdminLayout.jsx
│   │   ├── AdminSidebar.jsx
│   │   ├── AdminHeader.jsx
│   │   ├── ProtectedAdminRoute.jsx
│   │   ├── FlightForm.jsx
│   │   ├── HotelForm.jsx
│   │   ├── BusForm.jsx
│   │   ├── CabForm.jsx
│   │   └── FormStyles.css
│   ├── context/
│   │   └── AdminContext.jsx
│   └── services/
│       └── adminService.js

makemytrip-backend/
├── src/
│   ├── models/
│   │   ├── Admin.js
│   │   ├── Flight.js
│   │   ├── Hotel.js
│   │   ├── Bus.js
│   │   └── Cab.js
│   ├── controllers/
│   │   ├── adminAuthController.js
│   │   ├── flightAdminController.js
│   │   ├── hotelAdminController.js
│   │   ├── busAdminController.js
│   │   ├── cabAdminController.js
│   │   └── dashboardController.js
│   ├── middleware/
│   │   └── adminAuth.js
│   └── routes/
│       └── adminRoutes.js
└── scripts/
    └── seedAdmin.js
```

---

## 🛠️ Useful Commands

```bash
# Create admin account
node scripts/seedAdmin.js

# Reset admin password
node scripts/resetAdminPassword.js

# Seed demo data (flights, hotels, etc.)
npm run seed

# View admin logs
tail -f logs/admin.log

# Check API health
curl http://localhost:5000/health
```

---

## 🚨 Troubleshooting

### ❌ "Login Failed" Error
**Solution**: 
1. Ensure backend is running (`npm run dev`)
2. Check MongoDB is connected
3. Run `node scripts/seedAdmin.js` again
4. Check browser console for detailed error

### ❌ "Cannot POST /api/v1/admin/login"
**Solution**:
1. Ensure admin routes are registered in `src/index.js`
2. Check backend PORT is 5000
3. Verify CORS is configured: `http://localhost:5173`

### ❌ "No flights/hotels showing"
**Solution**:
1. Refresh page (Ctrl+R or Cmd+R)
2. Click "🔄 Refresh" button on page
3. Check network tab in DevTools for API errors
4. Ensure backend API is responding

### ❌ "Form submission fails"
**Solution**:
1. Fill all fields marked with * (required)
2. Check server logs for validation errors
3. Ensure data format is correct
4. Verify authentication token is valid

---

## 📝 API Test Examples

### Test Admin Login
```bash
curl -X POST http://localhost:5000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@makemytrip.com",
    "password": "admin123"
  }'
```

### Create Test Flight
```bash
curl -X POST http://localhost:5000/api/v1/admin/flights \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "airline": "Air India",
    "flightNumber": "AI101",
    "departure": {"city": "Delhi", "airport": "DEL", "time": "10:00", "date": "2026-06-15"},
    "arrival": {"city": "Mumbai", "airport": "BOM", "time": "12:30", "date": "2026-06-15"},
    "price": 5000,
    "seats": 180
  }'
```

### Get Dashboard Stats
```bash
curl http://localhost:5000/api/v1/admin/dashboard/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 Customization

### Change Admin Colors
Edit `makemytrip-frontend/src/components/Admin/AdminSidebar.css`:
```css
.sidebar-title {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Change Admin Logo
Edit `makemytrip-frontend/src/components/Admin/AdminSidebar.jsx`:
```jsx
<h2 className="sidebar-title">🚀 Your App Name Admin</h2>
```

### Add New Menu Item
Edit `makemytrip-frontend/src/components/Admin/AdminSidebar.jsx`:
```jsx
const menuItems = [
  // ... existing items ...
  { path: '/admin/new-page', label: 'New Page', icon: '🆕' }
]
```

---

## 📚 Full Documentation

For detailed information, see: `ADMIN_PANEL_GUIDE.md`

Topics covered:
- Complete feature list
- Database models
- All API endpoints
- Advanced features
- Security information
- Troubleshooting guide

---

## ✅ Next Steps

1. **Add Real Data**: Use the forms to add flights, hotels, etc.
2. **Test All Features**: Try CRUD, search, filters
3. **Customize**: Modify colors, branding, features
4. **Deploy**: Ready for production after security review
5. **Integrate**: Connect with payment and notification systems

---

## 🎉 You're All Set!

Your admin panel is ready to use. Start by:
1. Going to Dashboard to see statistics
2. Adding some flights/hotels
3. Exploring all management pages
4. Testing search and filters

For questions, refer to `ADMIN_PANEL_GUIDE.md` or check the code comments!

---

**Happy Admin Dashboard Development!** 🚀
