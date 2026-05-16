# Multi-Provider API Integration Setup Guide

This guide walks you through getting credentials for all partner APIs (Flights, Hotels, Buses, Cabs) and integrating them into the MakeMyTrip clone.

---

## Quick Start (5 minutes with mock data)

All APIs are configured to **gracefully fallback to realistic mock data** if credentials aren't available. This means:
- ✅ App works immediately without real API keys
- ✅ Realistic test data displays in search results
- ✅ All UI/UX features fully functional

To verify mock data is working:
```bash
cd makemytrip-backend
npm run dev

# In another terminal:
curl "http://localhost:5000/api/v1/search/flights?from=BLR&to=DEL&date=2026-06-15&passengers=1"
```

You should see 8 flight results with mock airline data.

---

## Full Setup (with real APIs)

### Step 1: Flights - Amadeus API (Priority)

**Signup:** https://developers.amadeus.com

1. Click "Register" → Create free account
2. Dashboard → "My Self-Service Workspace"
3. Create an app
4. Get these credentials:
   - `AMADEUS_CLIENT_ID`
   - `AMADEUS_CLIENT_SECRET`
5. Get an access token:
   ```bash
   curl -X POST https://api.amadeus.com/v1/security/oauth2/token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "grant_type=client_credentials&client_id=YOUR_ID&client_secret=YOUR_SECRET"
   ```
6. Copy the `access_token` → `AMADEUS_TOKEN` in `.env`

**Cost:** Free tier = 10,000 calls/month (sufficient for testing)

---

### Step 2: Flights - Skyscanner (Fallback)

**Signup:** https://rapidapi.com/skyscanner/api/skyscanner

1. RapidAPI account (or create one)
2. Search for "Skyscanner" API
3. Click "Subscribe to Test"
4. Copy **API Key** from "Authorization" section
5. Update `.env`:
   ```
   SKYSCANNER_API_KEY=your_key_here
   ```

**Cost:** Free tier = 500 calls/month

---

### Step 3: Hotels - Booking.com

**Signup:** https://affiliate.booking.com/en-gb/partners/partner-sign-up

1. Register as affiliate partner
2. Fill in business details
3. Get approved (24-48 hours)
4. Dashboard → "API" section
5. Request access to Booking API
6. Get credentials:
   - `BOOKING_API_KEY`
   - `BOOKING_AFFILIATE_ID`

**Cost:** Commission-based (no API costs)  
**Estimated monthly:** $500-5000 depending on conversions

---

### Step 4: Hotels - Agoda (Alternative)

**Signup:** https://partners.agoda.com/en-in/

1. Register for "Affiliate & API" program
2. Email: partnerships@agoda.com for API access
3. Provide:
   - Website/app details
   - Expected monthly bookings
   - Integration timeline
4. Receive `AGODA_API_KEY`

**Cost:** Commission-based  
**Note:** Faster approval than Booking.com in India region

---

### Step 5: Hotels - Expedia (Optional)

**Signup:** https://www.expediaaffiliate.com/en-us/signup

1. Join Expedia Affiliate Network
2. Dashboard → "API Tools"
3. Request EAN API access
4. Get:
   - `EXPEDIA_API_KEY`
   - `EXPEDIA_API_SECRET`

**Cost:** Commission model

---

### Step 6: Buses - GoIbibo (India Priority)

**Signup:** https://www.goibibo.com/api/

1. Email: partnerships@goibibo.com with:
   - Company name & website
   - Monthly expected bookings
   - Integration timeline
2. They'll provide:
   - `GOIBIBO_API_KEY`
   - `GOIBIBO_PARTNER_ID`

**Cost:** Commission (typically 5-15%)  
**Approval:** 3-5 business days

---

### Step 7: Buses - 12Go.asia (Regional)

**Signup:** https://12go.asia/en/affiliate

1. Register as affiliate
2. Dashboard → Request API access
3. Get `TWELVEGO_API_KEY`

**Cost:** Commission-based

---

### Step 8: Cabs - Uber

**Signup:** https://developer.uber.com/dashboard

1. Create account
2. "Create App" → "Rides"
3. Get:
   - `UBER_CLIENT_ID`
   - `UBER_CLIENT_SECRET`
4. Request "Access Token" grant type
5. Get `UBER_ACCESS_TOKEN`

**Cost:** Pay-per-request (~₹5-20 per ride)  
**Requirements:** Bank account, tax ID

---

### Step 9: Cabs - Ola (India Priority)

**Signup:** https://partners.olacabs.com

1. Register for "Partner & API" program
2. Email: partner.ecosystem@olaelectric.com with:
   - Company details
   - Expected volume
   - Integration plan
3. Receive `OLA_API_KEY` and `OLA_CLIENT_ID`

**Cost:** Commission (15-25%)  
**Approval:** 5-7 days

---

## Backend Configuration

1. Copy `.env.example` → `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update each section with your credentials:
   ```env
   # Example - Flight
   AMADEUS_CLIENT_ID=YOUR_ID_HERE
   AMADEUS_CLIENT_SECRET=YOUR_SECRET_HERE
   AMADEUS_TOKEN=YOUR_TOKEN_HERE
   
   # Example - Hotel
   BOOKING_API_KEY=YOUR_KEY_HERE
   AGODA_API_KEY=YOUR_KEY_HERE
   
   # ... continue for all APIs
   ```

3. Test the connection:
   ```bash
   npm run dev
   
   # In another terminal:
   curl "http://localhost:5000/api/v1/search/flights?from=BLR&to=DEL&date=2026-06-15"
   ```

---

## Testing Each Service

### Test Flights
```bash
curl "http://localhost:5000/api/v1/search/flights?from=BLR&to=DEL&date=2026-06-15&passengers=2"
```

### Test Hotels
```bash
curl "http://localhost:5000/api/v1/search/hotels?destination=Mumbai&checkinDate=2026-06-20&checkoutDate=2026-06-25&guests=2"
```

### Test Buses
```bash
curl "http://localhost:5000/api/v1/search/buses?from=DEL&to=BLR&date=2026-06-15"
```

### Test Cabs
```bash
curl "http://localhost:5000/api/v1/search/cabs?fromLat=28.5355&fromLng=77.3910&toLat=28.4089&toLng=77.3178"
```

### Check Provider Status
```bash
curl "http://localhost:5000/api/v1/search/providers"
```

---

## Frontend Usage

The frontend hooks automatically query the unified backend:

```javascript
import { useFlightSearch, useHotelSearch, useBusSearch, useCabSearch } from '@/hooks/useUnifiedSearch'

function MySearchComponent() {
  // Flights automatically combine Amadeus + Skyscanner
  const { data: flights, isLoading } = useFlightSearch('BLR', 'DEL', '2026-06-15', 1)
  
  // Hotels combine Booking + Agoda + Expedia
  const { data: hotels } = useHotelSearch('Mumbai', '2026-06-20', '2026-06-25', 2)
  
  // Buses combine GoIbibo + 12Go
  const { data: buses } = useBusSearch('DEL', 'BLR', '2026-06-15')
  
  // Cabs combine Uber + Ola
  const { data: cabs } = useCabSearch(28.5355, 77.3910, 28.4089, 77.3178)
}
```

---

## Features

✅ **Multi-Provider Search** — Queries all APIs in parallel, returns best results  
✅ **Intelligent Fallback** — Mock data if real APIs unavailable  
✅ **5-Minute Caching** — Reduces API calls, improves performance  
✅ **Error Handling** — Graceful degradation, detailed error messages  
✅ **Real-time Pricing** — Live prices from all providers  
✅ **Provider Transparency** — Each result shows which provider it came from

---

## Priority Order (Recommended Implementation)

| Phase | Service | APIs | Timeline |
|-------|---------|------|----------|
| **1** | Flights | Amadeus | 1 day |
| **2** | Hotels | Booking.com | 2-3 days |
| **3** | Buses | GoIbibo | 3-5 days |
| **4** | Cabs | Ola (or Uber) | 5-7 days |

---

## Troubleshooting

### "Mock data showing instead of real results"
- ✅ Normal! Check `.env` has correct API keys
- Verify with: `curl http://localhost:5000/api/v1/search/providers`

### "401 Unauthorized" from API
- Check token is valid and not expired
- Regenerate access token if needed

### "Rate limit exceeded"
- Upgrade to paid plan
- Implement request queuing in production

### "No results returned"
- Try different search parameters (city codes, dates)
- Check API documentation for valid formats

---

## Production Deployment

1. **Use environment secrets**, not `.env` files
2. **Implement request signing** for Booking API
3. **Add fraud detection** for bookings
4. **Set up monitoring** for API uptime
5. **Configure rate limiting** per provider
6. **Add caching layer** (Redis) for high traffic

---

## Additional Resources

- **Amadeus:** https://developers.amadeus.com/blog
- **RapidAPI:** https://rapidapi.com/guides
- **Booking Affiliate Network:** https://affiliate.booking.com/en-gb/partners
- **Agoda Partners:** https://partner.agoda.com
- **GoIbibo:** https://www.goibibo.com/pages/api-documentation/
- **Uber Developers:** https://developer.uber.com/docs
- **Ola Partners:** https://partners.olacabs.com/docs

---

**Need Help?**  
All APIs have generous free tiers for testing. Start with Amadeus (easiest) and add others as needed.  
The mock data fallback ensures your app always has results to show.
