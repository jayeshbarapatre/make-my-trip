# ⚡ 5-Minute Quick Start

## Pre-requisites
- ✅ PostgreSQL running on localhost:5432
- ✅ Both frontend & backend have dependencies installed (`npm install`)
- ✅ `.env` files are configured

---

## 🚀 Start Here (Do These in Order)

### 1️⃣ Seed Database (2 minutes)
```bash
cd makemytrip-backend
npm run seed:flights
```

**Expected:**
```
🌱 Seeding flights...
🗑️  Cleared existing flights
✅ Created flight: AI101
✅ Created flight: IG102
[... 18 more flights ...]
✨ Successfully seeded 20 flights!
```

### 2️⃣ Start Backend (1 minute)
**In a new terminal:**
```bash
cd makemytrip-backend
npm run dev
```

**Expected:**
```
Server running on http://localhost:5000
```

### 3️⃣ Start Frontend (1 minute)
**In another new terminal:**
```bash
cd makemytrip-frontend
npm run dev
```

**Expected:**
```
VITE v4.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

---

## ✅ Verify It Works

### Test 1: Open Frontend
1. Go to http://localhost:5173
2. You should see the MakeMyTrip homepage

### Test 2: Search Flights
1. Select **From**: New Delhi
2. Select **To**: Mumbai
3. Click **SEARCH**
4. Should see flights appear (5+ flights)

### Test 3: Check Flight Details
- ✅ Airline name visible
- ✅ Flight number visible (e.g., "AI101")
- ✅ Departure time (e.g., "06:00") + city code (DEL)
- ✅ Arrival time (e.g., "08:30") + city code (BOM)
- ✅ Price (e.g., "₹3,999")
- ✅ Duration (e.g., "2h 30m")

---

## 🔧 Troubleshooting

### ❌ "No flights found"
```bash
# Option 1: Re-seed
cd makemytrip-backend
npm run seed:flights

# Option 2: Check backend running
curl http://localhost:5000/health
# Should return: {"status":"ok"}
```

### ❌ CORS Error in Browser
```bash
# Edit: makemytrip-backend/.env
# Change to:
CORS_ORIGIN=http://localhost:5173

# Then restart backend (npm run dev)
```

### ❌ "Port 5000 already in use"
```bash
# Kill process on port 5000 (Windows PowerShell)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Then try again
npm run dev
```

### ❌ Database connection failed
```bash
# Check PostgreSQL is running
Get-Service PostgreSQL* | Select-Object Status

# Check .env DATABASE_URL
cat makemytrip-backend/.env | grep DATABASE_URL
# Should be: postgresql://postgres:psspl1!@localhost:5432/makemytrip
```

---

## 🎯 What Changed

### Backend ✅
- Added **POST** `/api/v1/flights` - create flight
- Added **PUT** `/api/v1/flights/:id` - update flight
- Added **DELETE** `/api/v1/flights/:id` - delete flight
- Added **GET** `/api/v1/flights` - get all flights
- Seed script: 20 real flights in database

### Frontend ✅
- Removed hardcoded dummy flights
- Fetch real data from API
- Added location filtering (from/to)
- Proper JSON parsing for departure/arrival

---

## 📊 Test Data Flights (From Seed)

Routes available:
- ✅ **New Delhi ↔ Mumbai** (5 flights)
- ✅ **Bengaluru ↔ Hyderabad** (5 flights)
- ✅ **Bangkok → Ahmedabad** (5 flights)
- ✅ **Bangkok ↔ Bengaluru** (5 flights)

Try these searches:
1. New Delhi → Mumbai
2. Bengaluru → Hyderabad
3. Ahmedabad → Bengaluru
4. Mumbai → Chennai

---

## 📝 API Quick Test

### Get All Flights
```bash
curl http://localhost:5000/api/v1/flights | jq '.data | length'
# Should return: 20
```

### Create Flight (Optional)
```bash
curl -X POST http://localhost:5000/api/v1/flights \
  -H "Content-Type: application/json" \
  -d '{
    "airline":"My Airline",
    "flightNumber":"MA999",
    "departure":{"city":"Pune","airport":"PNQ","time":"10:00"},
    "arrival":{"city":"Delhi","airport":"DEL","time":"12:00"},
    "price":5000
  }'

# Should return 201 Created
# Refresh frontend → new flight appears!
```

---

## 🎉 Success Indicators

When you see this, everything works:
- [ ] No red errors in browser console
- [ ] Flights show on search results page
- [ ] Can switch between different route searches
- [ ] Filters (airline, stops) work
- [ ] Sorting (price, time) works

---

## 📚 Full Documentation

See `BACKEND_FRONTEND_FIX_GUIDE.md` for:
- Detailed setup steps
- All troubleshooting scenarios
- API endpoint reference
- Database verification
- CRUD operation testing

See `FIX_SUMMARY.md` for:
- All changes made
- File modifications list
- Detailed testing checklist
- Data structure reference

---

## ⏱️ Timeline

| Step | Command | Time | Status |
|------|---------|------|--------|
| 1 | `npm run seed:flights` | 2 min | ⏳ Run First |
| 2 | `npm run dev` (backend) | 1 min | ⏳ Run Second |
| 3 | `npm run dev` (frontend) | 1 min | ⏳ Run Third |
| 4 | Open http://localhost:5173 | 1 min | ✅ Verify |
| **Total** | | **5 min** | |

---

## 🚀 You're All Set!

Everything is configured. Just follow the 3 simple commands above and you'll have:
- ✅ 20 flights in database
- ✅ Working backend API
- ✅ Working frontend with real data
- ✅ Flight search & filtering
- ✅ Location persistence

**Questions?** See `BACKEND_FRONTEND_FIX_GUIDE.md` for detailed help.
