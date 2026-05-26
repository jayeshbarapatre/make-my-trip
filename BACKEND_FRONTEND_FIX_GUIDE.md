# Backend-Frontend Flight Module Integration Fix Guide

## Issues Fixed ✅

1. **No CRUD Endpoints** - Added POST, PUT, DELETE endpoints for flights
2. **No Seed Data** - Created seed script with 20 real flights
3. **Dummy Data Fallback** - Removed dependency on hardcoded data
4. **Data Structure Mismatch** - Properly handling JSON serialization for departure/arrival
5. **Location Persistence** - Fixed to properly save and retrieve city/airport pairs

---

## Step 1: Setup Database

### 1.1 Ensure PostgreSQL is Running
```bash
# Check if PostgreSQL service is running (Windows)
Get-Service | Where-Object {$_.Name -like "*Postgres*"} | Select-Object Status

# Or start it manually
net start PostgreSQL
```

### 1.2 Create/Reset Database (Optional - if tables are corrupt)
```bash
cd makemytrip-backend

# Reset all tables
npx prisma migrate reset

# Or just apply migrations
npx prisma migrate deploy
```

---

## Step 2: Seed Flights to Database

```bash
cd makemytrip-backend

# Run seed script
npm run seed:flights

# Expected output:
# 🌱 Seeding flights...
# 🗑️  Cleared existing flights
# ✅ Created flight: AI101
# ✅ Created flight: IG102
# ...
# ✨ Successfully seeded 20 flights!
```

---

## Step 3: Start Backend Server

```bash
cd makemytrip-backend

# Start development server (with auto-reload)
npm run dev

# Expected output:
# Server running on http://localhost:5000
```

### Verify Backend is Running
```bash
# Test health endpoint
curl http://localhost:5000/health

# Should return: {"status":"ok"}
```

### Test Flight Endpoints
```bash
# Get all flights
curl http://localhost:5000/api/v1/flights

# Get single flight (replace ID with real ID from DB)
curl http://localhost:5000/api/v1/flights/{flightId}

# Should return flights with structure:
# {
#   "id": "...",
#   "airline": "Air India",
#   "flightNumber": "AI101",
#   "departure": "{\"city\":\"New Delhi\",\"airport\":\"DEL\",\"time\":\"06:00\"}",
#   "arrival": "{\"city\":\"Mumbai\",\"airport\":\"BOM\",\"time\":\"08:30\"}",
#   "price": 3999,
#   ...
# }
```

---

## Step 4: Start Frontend Development Server

```bash
cd makemytrip-frontend

# Start Vite dev server
npm run dev

# Expected output:
# VITE v4.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
```

### Verify Frontend API Connection
1. Open browser DevTools (F12)
2. Go to Console tab
3. Navigate to flight search page: `http://localhost:5173/flights/results?from=New%20Delhi&to=Mumbai`
4. Check Network tab - should see request to `http://localhost:5000/api/v1/flights`

---

## Step 5: Test Flight Search & Display

### 5.1 Homepage Search
1. Go to http://localhost:5173
2. Open Hero search section
3. Select:
   - **From**: New Delhi
   - **To**: Mumbai
   - **Date**: Any future date
   - **Passengers**: 1
4. Click SEARCH

### 5.2 Verify Results Page
- ✅ Should show flights from New Delhi → Mumbai
- ✅ Should display:
  - Airline name + logo
  - Flight number
  - Departure time & city code
  - Arrival time & city code
  - Duration
  - Price
  - Seats remaining
  - Stops info
- ✅ Flights should be sorted by price (cheapest first)

### 5.3 Verify Filters Work
- ✅ Filter by airline (checkboxes on left)
- ✅ Filter by stops (Non Stop, 1 Stop, 2+ Stops)
- ✅ Sort by: Cheapest, Fastest, Earliest, Latest

---

## Step 6: Test CRUD Operations (Admin)

### 6.1 Create New Flight (POST)
```bash
curl -X POST http://localhost:5000/api/v1/flights \
  -H "Content-Type: application/json" \
  -d '{
    "airline": "Air India Express",
    "flightNumber": "IX999",
    "departure": {"city":"Bengaluru","airport":"BLR","time":"10:00"},
    "arrival": {"city":"Hyderabad","airport":"HYD","time":"11:30"},
    "duration": "1h 30m",
    "price": 2500,
    "seats": 180,
    "stops": 0,
    "aircraft": "Boeing 737",
    "baggage": 15
  }'

# Should return 201 Created with flight data
```

### 6.2 Update Flight (PUT)
```bash
curl -X PUT http://localhost:5000/api/v1/flights/{flightId} \
  -H "Content-Type: application/json" \
  -d '{
    "price": 2200
  }'

# Should return updated flight
```

### 6.3 Delete Flight (DELETE)
```bash
curl -X DELETE http://localhost:5000/api/v1/flights/{flightId}

# Should return: {"message":"Flight deleted successfully"}
```

---

## Step 7: Verify Location Data Persistence

### 7.1 Check Database Directly
```bash
# Connect to PostgreSQL
psql -U postgres -d makemytrip -c "SELECT id, airline, flightNumber, departure, arrival FROM \"Flight\" LIMIT 1;"

# Should show:
# id                 | airline   | flightNumber | departure                                      | arrival
# xxx-xxx-xxx        | Air India | AI101        | {"city":"New Delhi","airport":"DEL",...}       | {"city":"Mumbai","airport":"BOM",...}
```

### 7.2 Frontend: Verify Location Search
1. Go to Search Results page
2. Change "From" city → should filter results
3. Change "To" city → should filter results
4. Swap cities → should swap from/to
5. Search for different route → should fetch new results

---

## Troubleshooting

### ❌ "No flights found" on Search Results
**Cause**: API not returning data
**Fix**:
1. Check backend is running: `curl http://localhost:5000/health`
2. Check Network tab in DevTools for API errors
3. Run seed again: `cd makemytrip-backend && npm run seed:flights`

### ❌ CORS Error in Console
**Cause**: Backend CORS not configured correctly
**Fix**:
```bash
# Check backend .env file
cat makemytrip-backend/.env

# Should have:
CORS_ORIGIN=http://localhost:5173
```

### ❌ Flights Not Displaying Properly
**Cause**: Departure/arrival JSON not being parsed
**Fix**:
1. Check browser console for errors
2. Check Network response to ensure JSON is valid
3. Verify seed script ran: `npm run seed:flights`

### ❌ Database Connection Error
**Cause**: PostgreSQL not running or connection string wrong
**Fix**:
```bash
# Check .env file DATABASE_URL
cat makemytrip-backend/.env | grep DATABASE_URL

# Should be: postgresql://postgres:psspl1!@localhost:5432/makemytrip
```

### ❌ Port Already in Use
**Error**: "Address already in use :5000" or ":5173"
**Fix**:
```bash
# Kill process on port 5000 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Or change port in backend: PORT=5001 npm run dev
```

---

## API Endpoint Reference

| Method | Endpoint | Description | Response |
|--------|----------|-------------|----------|
| GET | `/api/v1/flights` | Get all flights | `{data: Flight[]}` |
| GET | `/api/v1/flights/:id` | Get single flight | `{data: Flight}` |
| POST | `/api/v1/flights` | Create flight | `{data: Flight, message: string}` |
| PUT | `/api/v1/flights/:id` | Update flight | `{data: Flight, message: string}` |
| DELETE | `/api/v1/flights/:id` | Delete flight | `{message: string}` |

---

## Flight Data Structure

```javascript
{
  "id": "uuid",
  "airline": "Air India",
  "flightNumber": "AI101",
  "departure": {
    "city": "New Delhi",
    "airport": "DEL",
    "time": "06:00"          // or ISO: "2025-05-20T06:00:00"
  },
  "arrival": {
    "city": "Mumbai",
    "airport": "BOM",
    "time": "08:30"          // or ISO: "2025-05-20T08:30:00"
  },
  "duration": "2h 30m",
  "price": 3999,
  "seats": 180,
  "seatsAvailable": 180,
  "baggage": 15,              // kg
  "stops": 0,
  "aircraft": "Boeing 737",
  "refundable": true,
  "class": "Economy",
  "isActive": true,
  "createdAt": "2025-05-16T...",
  "updatedAt": "2025-05-16T..."
}
```

---

## Files Modified

### Backend
- ✅ `src/controllers/flightController.js` - Added CRUD handlers
- ✅ `src/routes/flights.js` - Added POST, PUT, DELETE routes
- ✅ `scripts/seedFlights.js` - Updated with 20 real flights

### Frontend
- ✅ `src/services/flightService.js` - Updated API calls for CRUD
- ✅ `src/pages/SearchResultsPage.jsx` - Removed dummy data, fetch real API

---

## Next Steps

1. ✅ Run seed script: `npm run seed:flights`
2. ✅ Start backend: `npm run dev` (in backend folder)
3. ✅ Start frontend: `npm run dev` (in frontend folder)
4. ✅ Test flight search on http://localhost:5173
5. ✅ Verify locations save/filter correctly
6. ✅ Test CRUD operations via API

---

## Success Criteria ✅

- [ ] Backend returns 20 flights on GET `/api/v1/flights`
- [ ] Frontend displays flights on search results page
- [ ] Location filtering works (From/To cities)
- [ ] Flight cards show all details (airline, times, price, etc.)
- [ ] Adding flight via POST API appears in frontend (after refresh)
- [ ] Updating flight via PUT reflects in frontend
- [ ] Deleting flight via DELETE removes from frontend
- [ ] No console errors for CORS or API failures
- [ ] All filters (airline, stops) work correctly
- [ ] Sorting (price, duration, time) works correctly
