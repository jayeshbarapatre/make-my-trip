# Quick Start: Multi-Provider API Integration

## ⚡ Get Started in 5 Minutes

Your app is **ready to run right now** with realistic mock data. No API keys needed to test.

### Step 1: Start the Backend
```bash
cd makemytrip-backend
npm run dev
```

### Step 2: Start the Frontend
```bash
cd makemytrip-frontend
npm run dev
```

### Step 3: Test in Browser
Visit `http://localhost:5173/`
- Search flights, hotels, buses, cabs
- All return mock data with realistic prices & operators
- UI is complete and functional

---

## 🔗 Add Real APIs (Optional)

When you're ready to connect real APIs:

### Phase 1: Flights (Fastest - 1 day)

1. **Get Amadeus credentials** (free tier, 10K calls/month):
   - Visit https://developers.amadeus.com
   - Create account
   - Dashboard → Get `AMADEUS_CLIENT_ID` & `AMADEUS_CLIENT_SECRET`
   - Get access token from OAuth endpoint
   
2. **Update `.env`:**
   ```env
   AMADEUS_CLIENT_ID=your_id
   AMADEUS_CLIENT_SECRET=your_secret
   AMADEUS_TOKEN=your_token
   ```

3. **Test:**
   ```bash
   curl "http://localhost:5000/api/v1/search/flights?from=BLR&to=DEL&date=2026-06-15"
   ```
   You'll see Amadeus results mixed with Skyscanner (if you add it).

### Phase 2: Hotels (2-3 days)

1. **Get Booking.com API** (commission-based):
   - https://affiliate.booking.com/en-gb/partners/partner-sign-up
   - Register as affiliate
   - Request API access (24-48 hours approval)

2. **Update `.env`:**
   ```env
   BOOKING_API_KEY=your_key
   ```

3. **Test:**
   ```bash
   curl "http://localhost:5000/api/v1/search/hotels?destination=Mumbai&checkinDate=2026-06-20&checkoutDate=2026-06-25"
   ```

### Phase 3: Buses (3-5 days)

1. **Get GoIbibo API** (India-focused):
   - Email: partnerships@goibibo.com
   - Provide: company name, website, monthly volumes
   - Get: `GOIBIBO_API_KEY` & `GOIBIBO_PARTNER_ID`

2. **Update `.env`:**
   ```env
   GOIBIBO_API_KEY=your_key
   GOIBIBO_PARTNER_ID=your_id
   ```

### Phase 4: Cabs (5-7 days)

1. **Get Ola API** (India):
   - https://partners.olacabs.com
   - Email: partner.ecosystem@olaelectric.com
   - Get: `OLA_API_KEY` & `OLA_CLIENT_ID`

2. **Update `.env`:**
   ```env
   OLA_API_KEY=your_key
   OLA_CLIENT_ID=your_id
   ```

---

## 📁 Files Created

### Backend
- `src/config/allApiClients.js` — All API client configurations
- `src/services/unifiedSearchService.js` — Search logic with mock fallbacks
- `src/routes/unifiedSearch.js` — API endpoints
- `.env.example` — Template for all credentials
- `src/index.js` — Updated to include unified routes

### Frontend
- `src/hooks/useUnifiedSearch.js` — React Query hooks
- `src/components/SearchResults/FlightCard.jsx` — Flight results card
- `src/components/SearchResults/HotelCard.jsx` — Hotel results card
- `src/components/SearchResults/BusCard.jsx` — Bus results card
- `src/components/SearchResults/CabCard.jsx` — Cab results card
- `src/styles/search-results.css` — Unified styling

---

## 🎯 Usage Examples

### Search Flights (React)
```javascript
import { useFlightSearch } from '@/hooks/useUnifiedSearch'

function FlightSearch() {
  const { data: flights, isLoading } = useFlightSearch(
    'BLR',      // from
    'DEL',      // to
    '2026-06-15', // date
    1           // passengers
  )

  if (isLoading) return <div>Loading...</div>

  return (
    <div>
      {flights?.map(flight => (
        <FlightCard key={flight.id} flight={flight} />
      ))}
    </div>
  )
}
```

### Search Hotels
```javascript
const { data: hotels } = useHotelSearch(
  'Mumbai',
  '2026-06-20',
  '2026-06-25',
  2 // guests
)
```

### Search Buses
```javascript
const { data: buses } = useBusSearch(
  'Delhi',
  'Bangalore',
  '2026-06-15'
)
```

### Search Cabs
```javascript
const { data: cabs } = useCabSearch(
  28.5355,  // fromLat
  77.3910,  // fromLng
  28.4089,  // toLat
  77.3178   // toLng
)
```

---

## 🛟 Troubleshooting

**Q: I see mock data. How do I get real data?**  
A: Add real API keys to `.env` and restart the backend. The system automatically switches.

**Q: How many providers can I add?**  
A: All of them! System queries all available APIs in parallel and combines results.

**Q: What if one API fails?**  
A: Others still work. Fallback to mock data if all fail.

**Q: Is there rate limiting?**  
A: Yes, 5-minute cache per search to reduce API calls.

**Q: Can I use just one provider?**  
A: Yes. Leave other API keys blank — system uses what's available.

---

## 📊 Architecture

```
Frontend (React)
    ↓
useFlightSearch() / useHotelSearch() / etc.
    ↓
GET /api/v1/search/flights
    ↓
UnifiedSearchService
    ├→ searchFlightsAmadeus() ✈️
    ├→ searchFlightsSkyscanner() ✈️
    └→ [Fallback to mock data] ✅
    ↓
Combine & sort results
    ↓
Return to Frontend
    ↓
FlightCard / HotelCard / BusCard / CabCard
```

---

## 🚀 Next Steps

1. **Test with mock data** (right now)
2. **Add Amadeus flights** (easiest, 1 day)
3. **Add Booking.com hotels** (2-3 days)
4. **Add GoIbibo buses** (3-5 days)
5. **Add Ola cabs** (5-7 days)

**Or start with just one provider and expand later!**

---

## 📚 Full Documentation

See `API_INTEGRATION_SETUP.md` for:
- Detailed signup instructions for each API
- Specific steps with screenshots
- Rate limits & pricing
- Production deployment guide
- Error handling strategies

---

## 💡 Pro Tips

✅ Start with **Amadeus** — simplest integration, works immediately  
✅ Use **mock data first** — verify UI/UX before spending on APIs  
✅ **Stagger implementation** — one API at a time, less overwhelming  
✅ **Monitor caching** — 5-minute TTL reduces costs dramatically  
✅ **Test endpoints** with `curl` before integrating to frontend  

---

**Everything is ready. Your app works with mock data right now. Add real APIs at your own pace.**
