# MakeMyTrip Clone — Implementation Roadmap

**Total Scope:** 18 modules across 3 layers  
**Estimated Time:** 4–6 days (full-time) or 2–3 weeks (part-time)  
**Deliverable:** Fully-functional OTA platform with 12 verticals + auth + profile

---

## 🏗️ LAYER 1: Foundation (Critical Path)

**Time:** 1 session (~4–6 hours)  
**Output:** Entire app scaffolding, routing, themes, mock API  

From `mmt-clone-build-prompt.md`, paste **PART 1 only**.

**Checklist:**
- [ ] Folder structure created
- [ ] Routing table (20+ routes)
- [ ] `theme.scss` (light + dark CSS variables)
- [ ] `mockApi.ts` + `seed.ts` (stable data across reloads)
- [ ] 10 shared components (Header, Footer, SearchTabs, FilterRail, SortBar, ResultCardShell, Skeleton, EmptyState, PriceBreakup, StepperNav)
- [ ] Home page wired (but with placeholder Tab content)
- [ ] Auth context + Redux slices (search, booking)
- [ ] localStorage setup for JWT, theme, search history

**Git:** Commit as `feat: foundation - routing, theme, mock api layer`

---

## 🔐 LAYER 2: Cross-Cutting Flows (Unlock All Others)

**Time:** 2–3 hours  
**Dependency:** LAYER 1 complete

### 2.0.1 Authentication
From PART 2, paste **2.0.1 only**.

**Deliverable:**
- [ ] Login page (email + OTP, remember me)
- [ ] Signup page (email, password strength, OTP)
- [ ] OTP verification (mock any 6 digits, 3 attempts, 60s resend cooldown)
- [ ] JWT → localStorage + auto-restore on reload
- [ ] Auth context integrates with Redux
- [ ] Protected routes (redirect to login if no token)
- [ ] Logout (clear localStorage + redirect)

**Git:** `feat: auth - login, signup, jwt persistence`

---

### 2.0.2 User Profile & Settings
From PART 2, paste **2.0.2 only**.

**Deliverable:**
- [ ] Profile card (avatar, name, email, phone, joined date)
- [ ] Edit profile form
- [ ] Saved travellers CRUD (name, DOB, gender, ID type/number, nationality)
- [ ] Saved payment cards (card number masked, expiry, set default)
- [ ] Email preferences (promotional, notifications)
- [ ] Password change (old + new with strength meter)
- [ ] Device logout (active sessions list)
- [ ] Delete account (confirmation, reason, warning)
- [ ] Activity log (recent logins, bookings, changes — last 30 days)

**Git:** `feat: user profile - travellers, cards, settings`

---

### 2.0.3 Global Search
From PART 2, paste **2.0.3 only**.

**Deliverable:**
- [ ] Omnibox on header
- [ ] Intent detection (e.g., "Delhi hotels" → /hotels, "Paris visa" → /visa)
- [ ] Recent searches + trending destinations
- [ ] Search suggestions grouped by vertical (flights, hotels, etc.)
- [ ] 300ms autocomplete delay mock

**Git:** `feat: global search - omnibox with intent routing`

---

## ✈️ LAYER 3: The 12 Booking Verticals (Parallel or Sequential)

**Time:** ~1 session (~4–5 hours) each  
**Dependency:** LAYER 1 + LAYER 2.0 complete

Each vertical follows the same 7-step flow:
1. Search widget (on home, tab-specific)
2. Listing page (filters, sort, skeleton, empty state)
3. Detail view (gallery, amenities, reviews, policies)
4. Option select (fare family / room type / seat map / etc.)
5. Traveller form (passengers/guests, contact, add-ons)
6. Review + pay (price breakup, coupons, payment methods)
7. Confirmation (booking ID, download voucher, My Trips link)

### 2.1 Flights
From PART 2, paste **2.1 only**.

**Key Details:**
- Trip type: one-way / round-trip / multi-city
- Search: from/to with airport autocomplete, dates, passengers (adult/child/infant), cabin class, fare type (regular/student/senior/armed forces)
- Listing: sticky modify bar, 7-day fare calendar, sort by price/duration/departure/arrival, filters for stops/departure time/airlines/price/baggage/refundable
- Card: airline logo (SVG), flight number, times, duration, stops, price
- Fare families: Saver / Flexi / Corporate (price delta, baggage, meals, seat selection, cancellation rules)
- Seat map: grid of occupied/available/extra-legroom/exit-row
- Meals & baggage add-ons
- PNR-style booking ID on confirmation

**Git:** `feat: flights module - end-to-end booking flow`

---

### 2.2 Hotels
From PART 2, paste **2.2 only**.

**Key Details:**
- Search: city/area autocomplete, check-in/check-out, rooms & guests (multi-room, per-room adults/children + ages)
- Listing: map toggle, filters for price/star/rating/property type/amenities/meal plan/free cancellation/pay-at-hotel, sort by popularity/price/rating/distance
- Detail: gallery with lightbox, about, amenity grid, room types (bed type, occupancy, inclusions, 3 rate plans), reviews with breakdown bars, nearby landmarks, house rules, FAQ
- Add-ons: airport pickup, early check-in, breakfast
- Voucher with check-in instructions on confirmation

**Git:** `feat: hotels module - end-to-end booking flow`

---

### 2.3 Homestays & Villas
From PART 2, paste **2.3 only**.

**Key Details:**
- Airbnb-style: whole-property pricing
- Host profile card (response rate, join date)
- "Entire villa / private room" toggle
- Capacity-based search, min-night rules, house rules, self check-in
- Amenities: kitchen, pool, caretaker, pet-friendly
- Nightly-rate calendar (weekend/peak surcharges)
- Locations: Goa, Lonavala, Coorg, Manali, Alibaug, Mussoorie, Wayanad, Udaipur

**Git:** `feat: homestays module - airbnb-style booking`

---

### 2.4 Buses
From PART 2, paste **2.4 only**.

**Key Details:**
- Search: from/to city autocomplete, date, "today/tomorrow" quick chips
- Filters: bus type (AC/non-AC/seater/sleeper/semi-sleeper), operator, departure time, boarding/dropping point, amenities (charging, water, blanket, live tracking), price
- Seat layout: interactive upper + lower deck, ladies/gents rules, per-seat pricing, max 6 seats
- Boarding/dropping point selection (with times)
- Passenger form per seat
- PNR + boarding QR placeholder on confirmation

**Git:** `feat: buses module - seat layout + boarding details`

---

### 2.5 Trains
From PART 2, paste **2.5 only**.

**Key Details:**
- Search: from/to station autocomplete (code + name), date, class, quota
- Listing: train number/name, running days, dep/arr, duration, class-wise availability strip (SL/3A/2A/1A/CC/EC) with AVAILABLE-42 / RAC-8 / WL-15 / NOT AVAILABLE color-coded
- Filters: departure time, class, quota, train type (Rajdhani/Shatabdi/Vande Bharat/Express), AC-only
- Detail: full route timetable with halts, distance, platform, day counter
- Passenger form: name, age, gender, berth preference, food choice, ID for Tatkal
- E-ticket with PNR + coach/berth allotment

**Git:** `feat: trains module - irctc-style availability + berth booking`

---

### 2.6 Cabs
From PART 2, paste **2.6 only**.

**Key Details:**
- 3 tabs: Airport Transfer / Outstation (one-way/round-trip) / Hourly Rental (4hr/40km, 8hr/80km, 12hr/120km)
- Car categories: Hatchback, Sedan, SUV, Premium SUV, Luxury, Tempo Traveller
- Per category: model examples, seats, luggage capacity, fuel type, AC, inclusive km, extra-km rate, driver allowance, toll/tax note, cancellation window
- Expandable fare breakup
- Pickup detail form
- Confirmation: driver-details-pending state

**Git:** `feat: cabs module - 3 trip types, vehicle categories`

---

### 2.7 Holiday Packages
From PART 2, paste **2.7 only**.

**Key Details:**
- Search: destination, departure city, month, duration, budget-per-person, theme (honeymoon/family/adventure/pilgrimage/beach/wildlife/luxury)
- Cards: hero image, nights/days, cities covered, inclusions icons (flight/hotel/transfer/meals/sightseeing), starting price, "customisable" badge
- Detail: day-by-day itinerary accordion with images, hotels per city with swap options, full inclusions/exclusions, cancellation policy, visa requirements, FAQ
- Customize panel: change hotel category, add nights, add activities, live price update
- 25% booking-amount payment option
- 20 domestic + 20 international mock packages

**Git:** `feat: packages module - itinerary + dynamic customization`

---

### 2.8 Tours & Activities
From PART 2, paste **2.8 only**.

**Key Details:**
- Search: city, date, category (sightseeing/adventure/water sports/theme parks/cultural/food/day trips/tickets & passes)
- Card: image, duration, "free cancellation" badge, "instant confirmation" badge, rating, price from
- Detail: highlights, what's included/excluded, meeting point, timeslot picker, ticket-type selector (adult/child/senior/family), what to bring, cancellation policy, reviews
- Quantity + timeslot → traveller form → pay → e-voucher with QR
- 60+ activities across 15 cities

**Git:** `feat: activities module - timeslots + instant confirmation`

---

### 2.9 Cruises
From PART 2, paste **2.9 only**.

**Key Details:**
- Search: departure port, destination region, month, duration, guests
- Listing: cruise line, ship name, nights, itinerary ports, sailing dates, price per person
- Detail: ship gallery, deck-by-deck highlights, day-wise itinerary (port arrival/departure times, sea days), dining, entertainment, onboard amenities
- Cabin select: Interior / Ocean View / Balcony / Suite (sqft, deck, occupancy, perks, price)
- Guest form: passport details required
- Add-ons: shore excursions, drinks package, wifi
- 20+ sailings (Cordelia domestic + international lines)

**Git:** `feat: cruises module - ship details + cabin selection`

---

### 2.10 Visa Services
From PART 2, paste **2.10 only**.

**Key Details:**
- Landing: country grid (flag, visa type badge, processing time, fee)
- Detail: visa types table, step-by-step process timeline, document checklist by applicant type (salaried/self-employed/student/minor/retired) with sample downloads, fee breakup, timeline, validity/stay, rejection reasons, FAQ
- Apply flow: applicant count → per-applicant form (passport, expiry, DOB, travel dates) → document upload (drag-drop, validation, progress, per-doc status chips) → review → pay → tracking page (5-stage stepper)
- 30+ countries

**Git:** `feat: visa module - document upload + application tracking`

---

### 2.11 Forex Cards & Currency Exchange
From PART 2, paste **2.11 only**.

**Key Details:**
- 5 tabs: Buy Forex Card / Reload Card / Buy Currency Notes / Sell Currency / Send Money Abroad
- Live rate board: 20+ currencies (buy rate, sell rate, day change %, timestamp)
- Currency converter widget (swap button, instant recalculation)
- Card products comparison: 3–4 cards (issuance fee, reload fee, ATM fee, cross-currency markup, supported currencies, insurance)
- Order flow: currency + amount → live conversion with fee breakup (rate, GST slab, TCS, delivery fee) → delivery vs branch pickup → KYC form (PAN, passport, travel date, purpose) → upload → pay → order tracking
- 20+ currencies, 4 card products, 6 city branches

**Git:** `feat: forex module - live rates + card comparison + kyc`

---

### 2.12 Travel Insurance
From PART 2, paste **2.12 only**.

**Key Details:**
- Search: destination region, trip dates, traveller ages, trip type (single/multi-trip/student)
- Listing: 12+ plans across 5 insurers, sum insured, premium, key-benefit chips, filters for insurer/sum insured/premium range/coverage type
- Side-by-side comparison drawer (up to 3 plans)
- Detail: full coverage table (medical, hospitalisation, baggage loss, trip delay, cancellation, passport loss, liability), deductibles, exclusions, claim process, pre-existing disease clause
- Traveller form: nominee details, medical declarations
- Policy document download
- Premiums ₹400–₹9,000 (age/duration/region dependent)

**Git:** `feat: insurance module - plan comparison + coverage tables`

---

## 🎯 LAYER 4: Cross-Cutting Content Pages (Parallel)

**Time:** ~30 min each  
**Dependency:** LAYER 1 complete

### 2.13 Offers & Promotions
From PART 2, paste **2.13 only**.

**Deliverable:**
- [ ] Coupon grid (code, discount %, max discount, min spend, expiry, vertical eligibility)
- [ ] Filters by vertical, discount range, expiry
- [ ] Terms modal
- [ ] Coupon validation (expired, min spend, already used, not eligible)
- [ ] Copy-to-clipboard
- [ ] Success toast on apply
- [ ] 10–15 mock coupons

**Git:** `feat: offers - coupon listing + validation + copy`

---

### 2.14 Help & Support
From PART 2, paste **2.14 only**.

**Deliverable:**
- [ ] FAQ accordion (15–20 FAQs by category)
- [ ] FAQ search/filter by keyword
- [ ] Contact form (name, email, phone, category, message, attachment)
- [ ] Mock 2s submission delay → ticket #123456 created
- [ ] Support channels (mock live chat with 3s response delay)
- [ ] Ticket tracker (open, resolved, closed)
- [ ] Common issues carousel (5 cards with quick solutions)
- [ ] 3–5 open tickets + 10+ resolved in history

**Git:** `feat: help - faq, contact form, ticket tracker`

---

### 2.15 Home Page (Complete Flow)
From PART 2, paste **2.15 only**.

**Deliverable:**
- [ ] Hero search with 12 tabs (flights, hotels, buses, trains, cabs, packages, activities, cruises, visa, forex, insurance, homestays)
- [ ] Popular destinations carousel (clickable → pre-filled search results)
- [ ] Offers carousel (clickable → /offers with coupon auto-selected)
- [ ] Trust badges section ("Price Match Guarantee", "24/7 Support", etc.)
- [ ] Recent searches (if logged in, last 5 searches)
- [ ] Deals carousel (flight/hotel/bus deals sorted by discount/expiry)
- [ ] All elements fully wired and clickable

**Git:** `feat: home - hero, carousels, wired navigation`

---

## 🧹 LAYER 5: Integration & Polish (Critical Path)

**Time:** 1–2 sessions (~6–8 hours)  
**Dependency:** All 18 modules complete

From `mmt-clone-build-prompt.md`, paste **PART 3 only**.

**Checklist:**

**My Trips:**
- [ ] Unified booking store in localStorage
- [ ] All 18 modules' bookings stored
- [ ] Tabs: Upcoming / Completed / Cancelled / Failed
- [ ] Vertical-specific cards (icon, dates, status, price, "View details" CTA)
- [ ] localStorage events sync across tabs

**Booking Detail + Cancellation:**
- [ ] Tap "Cancel" → show cancellation policy
- [ ] Calculate refund (100% >7d, ₹500 fee <24h, non-refundable, etc.)
- [ ] Breakdown: original price, deduction, final refund
- [ ] Reason dropdown (change plans, financial, health, etc.)
- [ ] Confirmation modal
- [ ] 2s mock cancellation → mark as "Cancelled" in My Trips
- [ ] Refund timeline display (5–7 working days)

**Payment Integration:**
- [ ] Central payment modal in review step (across all verticals)
- [ ] 5 methods: UPI, Credit Card, Debit Card, Net Banking, Wallet, Pay at Hotel
- [ ] Per-method form (if needed)
- [ ] "Processing..." 2s delay
- [ ] 10% random failure rate (for error testing)
- [ ] "Save for next time" checkbox → save to profile
- [ ] Transaction ID on success

**Download & Export:**
- [ ] Flights: e-ticket PDF (PNR, QR, itinerary, baggage)
- [ ] Hotels: voucher PDF (code, check-in, map)
- [ ] Buses: e-ticket (seat layout, PNR, T&Cs)
- [ ] Trains: e-ticket (PNR, coach/berth, rules)
- [ ] Cabs: booking summary (pending driver, GPS mock)
- [ ] Other verticals: appropriate format
- [ ] jsPDF placeholder (show download progress toast)

**Notifications & Email:**
- [ ] Post-booking toast: "Confirmation sent to your email"
- [ ] Mock notification history in profile

**Search State Persistence:**
- [ ] URL query params: `/flights?from=DEL&to=BOM&date=2024-12-25&passengers=2&class=economy`
- [ ] Shareable links
- [ ] Refresh-safe (filters survive F5)

**Dark Mode:**
- [ ] Toggle in header
- [ ] Light theme (white bg, dark text)
- [ ] Dark theme (dark bg, light text)
- [ ] CSS variables switch both states
- [ ] Persist to localStorage
- [ ] Check `prefers-color-scheme` on first visit

**Saved Travellers & Cards:**
- [ ] Auto-populate forms with saved data from profile
- [ ] Radio buttons to select existing
- [ ] "Add new" option to enter manually

**Cart/Wishlist (Optional but Nice):**
- [ ] Add-to-cart on flight/hotel cards
- [ ] Cart count badge in header
- [ ] Cart page lists items, remove items
- [ ] Proceed to first item's review

**Analytics Logging:**
- [ ] Log key events to console:
  - User logged in
  - Search performed (vertical, params)
  - Listing page viewed
  - Booking completed (vertical, amount)
  - Cancellation processed
- [ ] Include timestamps + event IDs

**FINAL AUDIT PASS:**
- [ ] No dead links (every CTA navigates to real page)
- [ ] No "No data" text (empty states designed, filters suggest alternatives)
- [ ] No missing images (every img has src, alt, width/height, onError fallback)
- [ ] No console errors/warnings
- [ ] No unhandled promise rejections
- [ ] Every form validates (required fields, email, dates, min/max)
- [ ] Every async view has 3 states (loading skeleton, loaded, error-with-retry)
- [ ] Keyboard navigation: tab, arrows, enter, escape
- [ ] Complete full booking with keyboard only (no mouse)
- [ ] Responsive: 360px, 768px, 1024px, 1440px
- [ ] Light + dark themes both render correctly
- [ ] localStorage persistence (refresh, bookmark, share URL)
- [ ] No unneeded re-renders (React DevTools Profiler)
- [ ] Axe accessibility audit: 0 violations, 4.5:1 contrast both themes

**Git:** `feat: integration - payments, my trips, cancellations, dark mode, audit`

---

## 🗂️ Folder Structure (After Foundation)

```
src/
├─ pages/                          # Route-level pages
│  ├─ Home.tsx
│  ├─ LoginPage.tsx                ✅ NEW
│  ├─ SignupPage.tsx               ✅ NEW
│  ├─ ProfilePage.tsx              ✅ NEW
│  ├─ FlightsSearch.tsx / FlightsListing.tsx / FlightDetail.tsx / FlightReview.tsx / FlightConfirm.tsx
│  ├─ HotelsSearch.tsx / HotelsListing.tsx / HotelDetail.tsx / HotelReview.tsx / HotelConfirm.tsx
│  ├─ ... (similar for buses, trains, cabs, packages, activities, cruises)
│  ├─ VisaSearch.tsx / VisaDetail.tsx / VisaApply.tsx / VisaTracking.tsx
│  ├─ ForexBuy.tsx / ForexRates.tsx
│  ├─ InsuranceSearch.tsx / InsuranceDetail.tsx
│  ├─ OffersPage.tsx               ✅ NEW
│  ├─ HelpPage.tsx                 ✅ NEW
│  ├─ MyTripsPage.tsx              ✅ NEW
│  ├─ BookingDetailPage.tsx        ✅ NEW
│  ├─ NotFoundPage.tsx
│  └─ ErrorPage.tsx
├─ components/
│  ├─ Header.tsx (with global search + dark mode toggle)
│  ├─ Footer.tsx
│  ├─ SearchTabs.tsx (flights, hotels, buses, etc. tabs on home)
│  ├─ FilterRail.tsx (generic filter sidebar)
│  ├─ SortBar.tsx
│  ├─ ResultCardShell.tsx (reusable card skeleton)
│  ├─ Skeleton.tsx (shimmer loader)
│  ├─ EmptyState.tsx (designed empty + suggestions)
│  ├─ PriceBreakup.tsx (fee breakdown modal/accordion)
│  ├─ StepperNav.tsx (7-step progress)
│  ├─ Modal.tsx
│  ├─ BottomSheet.tsx (mobile filter/search sheet)
│  ├─ DateRangePicker.tsx
│  ├─ TravellerSelector.tsx (adult/child/infant counts)
│  ├─ RatingStars.tsx
│  ├─ Toast.tsx (notification bottom-right)
│  └─ ... (vertical-specific components: SeatMap, FareBreakup, CabinSelector, etc.)
├─ mocks/
│  ├─ mockApi.ts                   # Central fetch wrapper (400–900ms delay)
│  ├─ seed.ts                      # Pseudo-random data generator
│  └─ data/
│     ├─ flights.ts                # 60+ flights
│     ├─ hotels.ts                 # 80+ hotels
│     ├─ homestays.ts              # 40+ homestays/villas
│     ├─ buses.ts                  # 50+ buses
│     ├─ trains.ts                 # 40+ trains
│     ├─ cabs.ts                   # 30+ cab categories × routes
│     ├─ packages.ts               # 40+ packages
│     ├─ activities.ts             # 60+ activities
│     ├─ cruises.ts                # 20+ cruises
│     ├─ visa.ts                   # 30+ countries
│     ├─ forex.ts                  # 20+ currencies, 4 cards
│     ├─ insurance.ts              # 12+ plans across 5 insurers
│     ├─ coupons.ts                # 10–15 coupons
│     ├─ faqs.ts                   # 20 FAQs
│     ├─ support-tickets.ts        # Mock tickets
│     └─ images.ts                 # All image URLs (constants)
├─ context/
│  ├─ AuthContext.tsx              # User + admin auth
│  └─ ThemeContext.tsx             # Dark mode toggle
├─ store/
│  ├─ index.ts                     # Redux setup
│  ├─ slices/
│  │  ├─ searchSlice.ts            # Search params (query, filters)
│  │  ├─ bookingSlice.ts           # Cart, review state
│  │  └─ profileSlice.ts           # Saved travellers, cards
├─ styles/
│  ├─ index.scss
│  ├─ theme.scss                   # CSS variables (light + dark)
│  ├─ mixins.scss
│  └─ utils.scss
├─ hooks/
│  ├─ useApi.ts                    # Wrapper around mockApi (loading, error, retry)
│  ├─ usePagination.ts
│  └─ useLocalStorage.ts
├─ utils/
│  ├─ priceFormatter.ts            # ₹1,23,456 format
│  ├─ dateUtils.ts                 # date-fns wrappers
│  ├─ validators.ts                # Zod schemas for all forms
│  └─ analytics.ts                 # Event logging to console
├─ App.tsx                         # Router + AuthProvider + ThemeProvider
└─ index.tsx
```

---

## 📊 Module Dependencies

```
LAYER 1 (Foundation)
    ↓
┌─────────────────────────┬─────────────────────────┬─────────────────┐
├─ 2.0.1 Auth            ├─ 2.0.2 Profile          ├─ 2.0.3 Search   │
├─ 2.1 Flights           ├─ 2.2 Hotels             ├─ 2.3 Homestays  │
├─ 2.4 Buses             ├─ 2.5 Trains             ├─ 2.6 Cabs       │
├─ 2.7 Packages          ├─ 2.8 Activities         ├─ 2.9 Cruises    │
├─ 2.10 Visa             ├─ 2.11 Forex             ├─ 2.12 Insurance │
├─ 2.13 Offers           ├─ 2.14 Help              ├─ 2.15 Home      │
└─────────────────────────┴─────────────────────────┴─────────────────┘
                                ↓
                        LAYER 5 (Integration)
                        ├─ My Trips
                        ├─ Payment
                        ├─ Cancellation/Refund
                        ├─ Dark Mode
                        ├─ Download/Export
                        └─ Audit Pass
```

---

## ✅ Definition of Done

Each module is "done" when:

1. **End-to-end wired** — Search → Listing → Detail → Option Select → Traveller Form → Review → Payment → Confirmation
2. **Mock data complete** — Minimum data volume, internally consistent (times match durations, prices scale, etc.)
3. **Filters work** — Every filter returns results or designed empty state (never "No data")
4. **Loading states exist** — Skeleton on load, error-with-retry on fail
5. **Forms validate** — Required fields, email format, date logic, min/max
6. **Responsive** — 360px, 768px, 1024px, 1440px viewport widths
7. **Keyboard navigable** — Tab through entire flow, Esc closes modals, Enter submits
8. **No console errors** — DevTools clean
9. **Bookings persist** — localStorage updated, appears in My Trips

---

## 🚀 Quick Start (Copy-Paste These)

### Day 1: Foundation + Auth
```bash
# Terminal
cd your-project
git checkout -b feat/foundation-auth

# Browser: Open mmt-clone-build-prompt.md
# Copy PART 1 → paste to AI
# Copy PART 2.0.1 → paste to AI
# Copy PART 2.0.2 → paste to AI
# Copy PART 2.0.3 → paste to AI

git add -A
git commit -m "feat: foundation + auth + profile + global search"
git push -u origin feat/foundation-auth
```

### Day 2-3: Flights (Template)
```bash
git checkout -b feat/flights-module

# Copy PART 2.1 → paste to AI
git commit -m "feat: flights module - end-to-end booking"
git push
```

### Day 3-5: Adapt Flights to Other Verticals
```bash
git checkout -b feat/all-verticals

# Copy PART 2.2 (Hotels) → paste to AI → commit
# Copy PART 2.3 (Homestays) → paste to AI → commit
# ... repeat for 2.4–2.12
# Copy PART 2.13–2.15 (Offers, Help, Home) → paste to AI → commit

git push
```

### Day 5-6: Integration & Audit
```bash
git checkout -b feat/integration-audit

# Copy PART 3 → paste to AI
git commit -m "feat: payments, my trips, cancellations, dark mode, audit"
git push

# Open PR, review, merge
```

---

## 🎯 Success Criteria

- [ ] All 18 modules built and wired
- [ ] 0 console errors in DevTools
- [ ] All forms validate
- [ ] All async views have loading/error states
- [ ] Keyboard-only navigation completes full booking
- [ ] Responsive at 360px, 768px, 1024px, 1440px
- [ ] Light + dark themes both render correctly
- [ ] localStorage persistence verified (refresh, share URL, bookmark)
- [ ] Axe accessibility audit: 0 violations
- [ ] No dead links (every CTA navigates to real page)
- [ ] No "No data" text (empty states designed)

---

**Ready to build?** Start with PART 1 (Foundation) and follow the roadmap above. 🚀
