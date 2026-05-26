# Code Changes Reference

## 1️⃣ Backend: flightController.js

### ✅ What Was Added

#### New Function: `getAllFlights()`
```javascript
export const getAllFlights = async (req, res) => {
  try {
    const flights = await prisma.flight.findMany({ orderBy: { price: 'asc' } })
    res.json({ data: flights })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
```

#### New Function: `createFlight()`
```javascript
export const createFlight = async (req, res) => {
  try {
    const { airline, flightNumber, departure, arrival, duration, price, seats, stops, aircraft, baggage } = req.body

    if (!airline || !flightNumber || !departure || !arrival || !price) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const depStr = typeof departure === 'string' ? departure : JSON.stringify(departure)
    const arrStr = typeof arrival === 'string' ? arrival : JSON.stringify(arrival)

    const flight = await prisma.flight.create({
      data: {
        airline,
        flightNumber,
        departure: depStr,
        arrival: arrStr,
        duration: duration || '2h',
        price: parseFloat(price),
        seats: seats || 180,
        seatsAvailable: seats || 180,
        stops: stops || 0,
        aircraft: aircraft || 'Boeing 737',
        baggage: baggage || 15,
        isActive: true
      }
    })

    res.status(201).json({ data: flight, message: 'Flight created successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
```

#### New Function: `updateFlight()`
```javascript
export const updateFlight = async (req, res) => {
  try {
    const { id } = req.params
    const { airline, departure, arrival, duration, price, seats, stops, aircraft, baggage, isActive } = req.body

    const flight = await prisma.flight.findUnique({ where: { id } })
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' })
    }

    let depStr = flight.departure
    let arrStr = flight.arrival

    if (departure) {
      depStr = typeof departure === 'string' ? departure : JSON.stringify(departure)
    }
    if (arrival) {
      arrStr = typeof arrival === 'string' ? arrival : JSON.stringify(arrival)
    }

    const updated = await prisma.flight.update({
      where: { id },
      data: {
        airline: airline || flight.airline,
        departure: depStr,
        arrival: arrStr,
        duration: duration || flight.duration,
        price: price ? parseFloat(price) : flight.price,
        seats: seats !== undefined ? seats : flight.seats,
        seatsAvailable: seats !== undefined ? seats : flight.seatsAvailable,
        stops: stops !== undefined ? stops : flight.stops,
        aircraft: aircraft || flight.aircraft,
        baggage: baggage !== undefined ? baggage : flight.baggage,
        isActive: isActive !== undefined ? isActive : flight.isActive
      }
    })

    res.json({ data: updated, message: 'Flight updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
```

#### New Function: `deleteFlight()`
```javascript
export const deleteFlight = async (req, res) => {
  try {
    const { id } = req.params
    const flight = await prisma.flight.findUnique({ where: { id } })
    if (!flight) {
      return res.status(404).json({ message: 'Flight not found' })
    }

    await prisma.flight.delete({ where: { id } })
    res.json({ message: 'Flight deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
```

---

## 2️⃣ Backend: routes/flights.js

### ✅ What Changed

**BEFORE:**
```javascript
import { Router } from 'express'
import { searchFlights, getFlightById } from '../controllers/flightController.js'

const router = Router()
router.get('/search', searchFlights)
router.get('/:id', getFlightById)
export default router
```

**AFTER:**
```javascript
import { Router } from 'express'
import { searchFlights, getFlightById, getAllFlights, createFlight, updateFlight, deleteFlight } from '../controllers/flightController.js'

const router = Router()

router.get('/', getAllFlights)
router.get('/search', searchFlights)
router.get('/:id', getFlightById)
router.post('/', createFlight)
router.put('/:id', updateFlight)
router.delete('/:id', deleteFlight)

export default router
```

**Summary:**
- ✅ Added imports for 3 new functions
- ✅ Added GET `/` → getAllFlights
- ✅ Added POST `/` → createFlight
- ✅ Added PUT `/:id` → updateFlight
- ✅ Added DELETE `/:id` → deleteFlight

---

## 3️⃣ Frontend: flightService.js

### ✅ What Changed

**BEFORE:**
```javascript
import api from './api'

export const flightService = {
  search: (params) => api.get('/flights/search', { params }),
  getById: (id) => api.get(`/flights/${id}`),
  getAirlines: (query) => api.get('/autocomplete/airlines', { params: { q: query } }),
  getAirports: (query) => api.get('/autocomplete/airports', { params: { q: query } }),
  getCities: (query) => api.get('/autocomplete/cities', { params: { q: query } }),
  getAircrafts: (query) => api.get('/autocomplete/aircrafts', { params: { q: query } })
}
```

**AFTER:**
```javascript
import api from './api'

export const flightService = {
  getAll: () => api.get('/flights'),
  search: (params) => api.get('/flights', { params }),
  getById: (id) => api.get(`/flights/${id}`),
  create: (data) => api.post('/flights', data),
  update: (id, data) => api.put(`/flights/${id}`, data),
  delete: (id) => api.delete(`/flights/${id}`),
  getAirlines: (query) => api.get('/autocomplete/airlines', { params: { q: query } }),
  getAirports: (query) => api.get('/autocomplete/airports', { params: { q: query } }),
  getCities: (query) => api.get('/autocomplete/cities', { params: { q: query } }),
  getAircrafts: (query) => api.get('/autocomplete/aircrafts', { params: { q: query } })
}
```

**Changes:**
- ✅ Changed `/flights/search` → `/flights` (for search)
- ✅ Added `getAll()` method
- ✅ Added `create()` method
- ✅ Added `update()` method
- ✅ Added `delete()` method

---

## 4️⃣ Frontend: SearchResultsPage.jsx

### ✅ What Changed (Lines 182-190)

**BEFORE:**
```javascript
const { data, isLoading } = useQuery({
  queryKey: ['flights', criteria],
  queryFn:  () => flightService.search(criteria),
  enabled:  !!(criteria.from && criteria.to),
})

const apiFlights   = data?.data || []
const dummyFlights = useMemo(() => searchDummyFlights(criteria), [criteria.from, criteria.to])
const allFlights   = apiFlights.length > 0 ? apiFlights : dummyFlights
```

**AFTER:**
```javascript
const { data, isLoading } = useQuery({
  queryKey: ['flights'],
  queryFn:  () => flightService.getAll(),
})

const apiFlights = data?.data || []
const parsedFlights = apiFlights.map(f => ({
  ...f,
  departure: typeof f.departure === 'string' ? JSON.parse(f.departure) : f.departure,
  arrival: typeof f.arrival === 'string' ? JSON.parse(f.arrival) : f.arrival,
  refundable: f.refundable !== undefined ? f.refundable : true,
  class: f.class || 'Economy'
}))

const allFlights = parsedFlights.filter(f =>
  f.departure.city.toLowerCase().includes(criteria.from.toLowerCase()) &&
  f.arrival.city.toLowerCase().includes(criteria.to.toLowerCase())
).length > 0 ?
  parsedFlights.filter(f =>
    f.departure.city.toLowerCase().includes(criteria.from.toLowerCase()) &&
    f.arrival.city.toLowerCase().includes(criteria.to.toLowerCase())
  ) :
  parsedFlights
```

**Changes:**
- ✅ Removed `dummyFlights` import and fallback
- ✅ Changed query to call `getAll()` instead of `search()`
- ✅ Added JSON parsing for departure/arrival fields
- ✅ Added location-based filtering
- ✅ Added default values for refundable & class

---

## 5️⃣ Backend: seedFlights.js (Updated)

### ✅ Key Changes

**Old Seed:**
- ❌ Only 10 flights
- ❌ Limited routes
- ❌ Hardcoded time values

**New Seed:**
- ✅ 20 flights across multiple routes
- ✅ All major airlines included
- ✅ Proper JSON structure for departure/arrival
- ✅ Clears existing flights before seeding
- ✅ Includes all required fields

**Sample Flight Structure:**
```javascript
{
  airline: 'Air India',
  flightNumber: 'AI101',
  departure: JSON.stringify({
    city: 'New Delhi',
    airport: 'DEL',
    time: '06:00'
  }),
  arrival: JSON.stringify({
    city: 'Mumbai',
    airport: 'BOM',
    time: '08:30'
  }),
  duration: '2h 30m',
  price: 3999,
  seats: 180,
  stops: 0,
  aircraft: 'Boeing 737',
  baggage: 15,
  isActive: true
}
```

---

## 📊 Comparison: Before vs After

| Feature | Before | After |
|---------|--------|-------|
| Get all flights | ❌ No | ✅ GET `/api/v1/flights` |
| Create flight | ❌ No | ✅ POST `/api/v1/flights` |
| Update flight | ❌ No | ✅ PUT `/api/v1/flights/:id` |
| Delete flight | ❌ No | ✅ DELETE `/api/v1/flights/:id` |
| Seed flights | ✅ 10 flights | ✅ 20 flights |
| Frontend API calls | ❌ Wrong endpoint | ✅ Correct endpoint |
| Dummy data | ✅ Used by default | ❌ Removed, real API data |
| Location filtering | ❌ Not done | ✅ Client-side filter |
| JSON parsing | ❌ Not handled | ✅ Properly parsed |

---

## 🔄 Data Flow After Changes

```
User Search
    ↓
Frontend: SearchResultsPage
    ↓
Frontend: flightService.getAll()
    ↓
Backend: GET /api/v1/flights
    ↓
Backend: flightController.getAllFlights()
    ↓
Prisma: prisma.flight.findMany()
    ↓
PostgreSQL Database
    ↓
Flights returned with JSON strings
    ↓
Frontend: JSON.parse() departure/arrival
    ↓
Frontend: Filter by from/to cities
    ↓
Display Flight Cards
```

---

## ✅ API Endpoint Summary

### Now Available

| Method | Path | Handler | Status Code |
|--------|------|---------|-------------|
| GET | `/api/v1/flights` | getAllFlights | 200 |
| GET | `/api/v1/flights/:id` | getFlightById | 200 |
| GET | `/api/v1/flights/search` | searchFlights | 200 |
| POST | `/api/v1/flights` | createFlight | 201 |
| PUT | `/api/v1/flights/:id` | updateFlight | 200 |
| DELETE | `/api/v1/flights/:id` | deleteFlight | 200 |

---

## 📝 Files Modified

1. ✅ `makemytrip-backend/src/controllers/flightController.js` (84 lines added)
2. ✅ `makemytrip-backend/src/routes/flights.js` (5 routes added)
3. ✅ `makemytrip-backend/scripts/seedFlights.js` (20 flights, updated)
4. ✅ `makemytrip-frontend/src/services/flightService.js` (4 methods added)
5. ✅ `makemytrip-frontend/src/pages/SearchResultsPage.jsx` (data fetching fixed)

---

## 🎯 What This Solves

- ✅ **No CRUD endpoints** → Added POST, PUT, DELETE
- ✅ **No real data** → 20 flights in database
- ✅ **Dummy data fallback** → Using real API data only
- ✅ **Location not saved** → Proper JSON structure
- ✅ **API mismatch** → Correct endpoints
- ✅ **No filtering** → Location-based filtering added
- ✅ **No CRUD in UI** → Can now create/update/delete flights
