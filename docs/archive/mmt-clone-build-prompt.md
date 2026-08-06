# Master Prompt — MakeMyTrip-Style Travel Platform (Full Working Flows + Dummy Data)

> **How to use this file:** Paste **Part 1** first. Then paste **Part 2** modules one at a time (auth → flights → hotels → buses → …). Feeding everything in one prompt produces shallow, half-finished work. One module per turn gives real, complete flows.
>
> **QUICK START PATH:**
> 1. Part 1 (Foundation) — ~1 session
> 2. Part 2.0.1 (Auth) — ~30 min
> 3. Part 2.1 (Flights) — ~1 session (template for others)
> 4. Part 2.2–2.9 (Adapt flights pattern to other verticals) — ~1 session each
> 5. Part 2.10–2.15 (Simpler/service modules) — ~30 min each
> 6. Part 3 (Wrap-up: payments, notifications, audit) — ~1 session

---

## System Architecture At-A-Glance

```
User (Browser)
  ↓
Frontend (React 18 + Vite)
  ├─ Auth Context (login/profile/saved travellers)
  ├─ Search State (Redux) — query params in URL
  ├─ Booking State (Redux) — cart, review, payment
  └─ 15 Module Pages (auth, flights, hotels, buses, trains, cabs, packages,
                      activities, cruises, visa, forex, insurance, offers,
                      help, home)
    ↓
Mock API Layer (src/mocks/)
  ├─ mockApi.ts — central fetch wrapper (400-900ms delay)
  ├─ data/*.ts — flights, hotels, buses, trains, cabs, packages, activities,
                 cruises, visa, forex, insurance, coupons (60–80 items each)
  └─ seed.ts — pseudo-random stable data across reloads
    ↓
Browser Storage
  ├─ localStorage — JWT token, user profile, search history, dark mode
  └─ Redux store — current search, booking in progress, cart
```

**Data Flow Example (Flight Booking):**
```
1. User fills search form → Redux store updated + URL query params set
2. "Search" clicked → mockApi.get('/flights', params) 
3. 600ms delay → mock returns 50 flights matching params
4. Listing page renders with filters, sort, skeleton loading
5. User clicks flight → detail page (via URL :id param)
6. "Continue" → traveller form (modal or page)
7. Form submit → review step (price breakup, coupons, passenger summary)
8. "Pay now" → payment modal (UPI/card/wallet)
9. "Processing..." 2s → localStorage updated with booking
10. Confirmation page + "Download e-ticket" button + "View in My Trips" link
11. My Trips page lists this booking under "Upcoming"
```

---

## PART 1 — Foundation Prompt (paste this first)

```
You are a senior full-stack engineer building a MakeMyTrip-style online travel
agency (OTA). I already have a partial UI. Your job is to make EVERY vertical a
complete, clickable, end-to-end flow backed by realistic mock data — nothing
should dead-end, show "no data", or throw on a missing field.

### TECH STACK
- React 18 + TypeScript + Vite
- React Router v6 for routing
- Redux Toolkit (or Zustand) for search params, cart, and booking state
- SCSS modules, with a global theme layer (light + dark) driven by CSS variables
- date-fns for dates, react-hook-form + zod for all forms
- No real backend. Build a `src/mocks/` layer that simulates an API:
  every fetch goes through `mockApi.get(path, params)` which returns a Promise
  resolved after a 400–900ms random delay, so loading skeletons are real.

### THE 12 VERTICALS (all must work identically well)
1. Flights (one-way / round-trip / multi-city / international)
2. Hotels
3. Homestays & Villas
4. Buses
5. Trains
6. Cabs (airport transfer, outstation, hourly rental)
7. Holiday Packages
8. Tours & Activities
9. Cruises
10. Visa Services
11. Forex Cards & Currency Exchange
12. Travel Insurance

### THE UNIVERSAL 7-STEP FLOW
Every vertical must implement this same skeleton. If a step doesn't apply,
adapt it — never skip it.

  1. SEARCH WIDGET  — on home page, tabbed by vertical, with autocomplete,
     date pickers, traveller/room selectors, validation
  2. LISTING PAGE   — results + left-rail filters + sort bar + result count +
     loading skeletons + empty state + "modify search" collapsible header
  3. DETAIL VIEW    — expanded card, image gallery, amenities/fare rules,
     reviews, map placeholder, policy accordions
  4. OPTION SELECT  — fare families / room types / seat map / berth / cab class
  5. TRAVELLER FORM — passenger details, contact, GST (optional), add-ons
     (meals, baggage, insurance, breakfast, pickup)
  6. REVIEW + PAY   — price breakup, coupon field, payment method tabs
     (UPI / Card / Netbanking / Wallet / Pay-at-hotel), mock 2-second
     "processing" then success
  7. CONFIRMATION   — booking ID, itinerary summary, download-voucher button,
     "View in My Trips"

Plus these critical cross-cutting pages (must be wired end-to-end):
  - Home (hero search, deals carousel, popular destinations, offers grid)
  - My Trips (upcoming / completed / cancelled / failed tabs, pulls from mock store)
  - Booking detail + cancellation/refund flow (with refund breakdown by policy)
  - Login / Signup (OTP screen, mock — any 6 digits work, persists to localStorage)
  - User Profile (saved travellers, saved cards, edit profile, email preferences)
  - Offers & Promotions (coupon listing, eligibility rules, apply-to-cart)
  - Help & Support (FAQ, contact form, ticket tracking)
  - 404 & Error Pages (with navigation suggestions)

### MOCK DATA RULES — THIS IS THE PART THAT MATTERS MOST
- Put every dataset in `src/mocks/data/<vertical>.ts` with a typed interface.
- Minimum volume so filters and pagination actually have something to bite on:
    flights 60+, hotels 80+, homestays 40+, buses 50+, trains 40+,
    cabs 30+, packages 40+, activities 60+, cruises 20+,
    visa countries 30+, forex currencies 20+, insurance plans 12+
- Data must be INTERNALLY CONSISTENT: departure < arrival, duration matches
  the timestamps, non-stop flights have zero layovers, price scales with
  cabin class and star rating, review count matches the reviews array length.
- Cover Indian routes and cities primarily (DEL, BOM, BLR, MAA, CCU, HYD,
  GOI, JAI, PNQ, AMD, COK, IXC), plus international (DXB, SIN, BKK, LHR, JFK).
- Include deliberate edge cases so the UI proves itself: a sold-out hotel,
  a fully-booked bus, a flight with a 14-hour layover, a non-refundable fare,
  a package with only 2 seats left, a cancelled train.
- Write a seeded pseudo-random generator (`src/mocks/seed.ts`) so results are
  stable across reloads — no flickering prices.
- NEVER render "No data available". If a filter combination returns nothing,
  show a designed empty state with a "Clear filters" CTA and 3 suggested
  alternatives from the dataset.

### IMAGES
Use free, hotlink-permitted sources. Store every URL in
`src/mocks/data/images.ts` as named constants — never inline a raw URL in a
component.
- Unsplash:  https://images.unsplash.com/photo-<id>?w=800&q=80&auto=format
- Pexels:    https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&w=800
- Fallback placeholder: https://picsum.photos/seed/<slug>/800/600
Requirements:
- Every image needs a real `alt`, explicit width/height (to stop layout shift),
  `loading="lazy"`, and an `onError` handler that swaps to the picsum fallback.
- Airline logos, bank logos, and payment icons: use inline SVG you generate
  yourself. Do not hotlink brand assets.
- Categories needed: city skylines, hotel rooms, resort pools, villa
  interiors, beaches, mountains, temples, cruise ships, buses, trains,
  cars, adventure activities, food, passports/visa desks.

### QUALITY BAR
- Fully responsive: 360px, 768px, 1024px, 1440px. Mobile gets a bottom sheet
  for filters and a sticky price bar.
- Accessibility: semantic landmarks, keyboard-navigable date pickers and
  filters, visible focus rings, ARIA on tabs/accordions/modals, 4.5:1 contrast
  in BOTH themes, `prefers-reduced-motion` respected.
- Every async view has three states: loading skeleton, loaded, error-with-retry.
- No `any`. No console errors. No unhandled promise rejections.
- Currency formatted as ₹1,23,456 (Indian grouping) via Intl.NumberFormat.

### DELIVER NOW (this turn only)
1. Full folder structure
2. Routing table (path → component → guard)
3. `theme.scss` — CSS variables, light + dark, spacing/radius/shadow scale
4. `mockApi.ts` + `seed.ts`
5. Shared components: Header, Footer, SearchTabs, FilterRail, SortBar,
   ResultCardShell, Skeleton, EmptyState, PriceBreakup, StepperNav, Modal,
   BottomSheet, DateRangePicker, TravellerSelector, RatingStars, Toast
6. Home page fully wired

Do NOT scaffold the 12 verticals yet. Ask me for module 1 when done.
```

---

## PART 2 — Module Prompts (paste one per turn)

Each follows the same shape. Swap in the vertical-specific details.

**DO THESE FIRST (cross-cutting flows):**

### 2.0.1 Authentication (Login & Signup)

```
Build LOGIN & SIGNUP flows that persist to localStorage.

Login: Email + OTP (mock any 6 digits), or email/password fallback.
Show "Remember me" checkbox. Store JWT in localStorage + set global auth state.
Signup: Email, password (strength meter), OTP verification, name, phone number.
Login success → redirect to referrer or home. Invalid OTP → retry with 3 attempts, 
then "resend OTP" cooldown (60s).
Mock 800ms delay on OTP verification to simulate backend.
Error states: "Invalid OTP", "Account does not exist", "Email already registered".
Add "Continue with Google" button (visual only, mock).
```

### 2.0.2 User Profile & Settings

```
Build PROFILE page (auth required):
- Profile card: avatar, name, email, phone, joined date
- Edit profile form: name, phone, email (with verification on change)
- Saved travellers list: add/edit/remove cards with passenger details 
  (name, DOB, gender, ID type, ID number, nationality)
- Saved payment cards: card number (masked), expiry, name, set default
- Email preferences: promotional emails on/off, booking notifications on/off
- Password change: old password, new password (strength meter), confirm
- Device logout: show active sessions, "logout from other devices" button
- Delete account: confirmation modal, reason dropdown, irreversible warning
- Account activity log: recent logins, bookings, profile changes (last 30 days)
Mock data: 3 saved travellers, 2 saved cards per user.
```

### 2.0.3 Global Search & Navigation

```
Build GLOBAL SEARCH (omnibox on header):
- One input, routes to the right vertical based on intent
- Autocomplete with recent searches + trending destinations
- "From Mumbai to Delhi" → /flights
- "Hotels in Goa" → /hotels
- "Delhi to Jaipur bus" → /buses
- "Paris visa" → /visa
- "Travel insurance" → /insurance
- Show search suggestions grouped by vertical (flights, hotels, etc.)
Mock 300ms delay for autocomplete results.
```

**NOW THESE 12 VERTICALS:**

### 2.1 Flights

```
Build the FLIGHTS module end-to-end using the foundation from before.

Search: trip type (one-way/round-trip/multi-city), from/to with airport
autocomplete (code + city + airport name), departure/return dates, traveller
counts (adult/child/infant), cabin class, "fare type" chips (regular, student,
senior citizen, armed forces).

Listing: sticky modify-search bar; a 7-day fare calendar strip; sort by price /
duration / departure / arrival; filters for stops, departure-time buckets,
airlines, price slider, layover airports, baggage-included, refundable.
Round-trip uses a split-pane outbound/return selector with a combined footer.

Card: airline logo (inline SVG), flight number, dep/arr time + airport code,
duration, stop count with layover city, price, "flight details" expander with
per-leg segments, baggage allowance, and cancellation/date-change fee table.

Fare families: Saver / Flexi / Corporate, each with different baggage, meal,
seat-selection and cancellation rules and a price delta.

Then seat map (grid with occupied/available/extra-legroom/exit-row pricing),
meal and baggage add-ons, traveller form, review, payment, confirmation with
a PNR-style booking ID.

Mock data: 60+ flights across 15 airlines, realistic Indian domestic timings
and fares (₹2,800–₹9,500 domestic economy), international ₹18,000–₹85,000.
```

### 2.2 Hotels

```
Build the HOTELS module.
Search: city/hotel/area autocomplete, check-in/check-out, rooms & guests
(multi-room, per-room adult/child + child ages).
Listing: map toggle, filters for price, star rating, guest rating, property
type, amenities, locality, meal plan, "free cancellation", "pay at hotel".
Sort by popularity / price / rating / distance.
Detail: image gallery with lightbox, about, amenity grid by category, room
type list (each with occupancy, bed type, inclusions, cancellation policy,
3 rate plans), reviews with rating breakdown bars + review filters, location
with nearby landmarks, house rules, FAQ accordion.
Then room select → guest details → add-ons (airport pickup, early check-in,
breakfast) → review → pay → voucher.
Mock data: 80+ hotels across 12 Indian cities, 2–5 star, ₹1,200–₹45,000/night.
```

### 2.3 Homestays & Villas

```
Build HOMESTAYS & VILLAS — Airbnb-style, distinct from hotels.
Whole-property pricing, host profile card with response rate and join date,
"entire villa / private room" toggle, capacity-based search, minimum-night
rules, per-property house rules, self check-in flag, amenities skewed to
kitchen/pool/caretaker/pet-friendly, and a nightly-rate calendar showing
weekend and peak-season surcharges.
Mock data: 40+ properties in Goa, Lonavala, Coorg, Manali, Alibaug,
Mussoorie, Wayanad, Udaipur.
```

### 2.4 Buses

```
Build BUSES.
Search: from/to city autocomplete + date + "today/tomorrow" quick chips.
Listing: filters for bus type (AC/non-AC, seater/sleeper/semi-sleeper),
operator, departure time buckets, boarding/dropping point, amenities
(charging, water, blanket, live tracking), price. Show operator rating,
seats available, and "primo" badge.
Seat layout: interactive lower + upper deck, seater/sleeper geometry,
ladies/gents seat rules, per-seat pricing, max 6 seats.
Then boarding & dropping point selection (with time), passenger form
per seat, review, pay, ticket with PNR + boarding QR placeholder.
Mock data: 50+ services across 20 operators on 15 popular routes.
```

### 2.5 Trains

```
Build TRAINS (IRCTC-style).
Search: from/to station autocomplete (code + name), date, class, quota.
Listing: train number/name, running days, dep/arr with station codes,
duration, and a class-wise availability strip (SL/3A/2A/1A/CC/EC) where each
chip shows AVAILABLE-42 / RAC-8 / WL-15 / NOT AVAILABLE with a colour code
and a "prediction: confirm likely" hint.
Filters: departure time, class, quota, train type (Rajdhani/Shatabdi/Vande
Bharat/Express), AC-only.
Detail: full route timetable with halts, distance, platform, day counter.
Then passenger form (name/age/gender/berth preference/food choice/ID for
Tatkal), review, pay, e-ticket with PNR and coach/berth allotment.
Mock data: 40+ trains on 12 routes with realistic numbers and timings.
```

### 2.6 Cabs

```
Build CABS with three tabs: Airport Transfer, Outstation (one-way/round-trip),
Hourly Rental (4hr/40km, 8hr/80km, 12hr/120km).
Search: pickup with address autocomplete, drop, date, time.
Listing: car categories (Hatchback/Sedan/SUV/Premium SUV/Luxury/Tempo
Traveller) with model examples, seats, luggage capacity, fuel type, AC,
inclusive km, per-extra-km rate, driver allowance, toll/state-tax note,
cancellation window, and an expandable fare breakup.
Then pickup detail form, review, pay, confirmation with driver-details-
pending state.
Mock data: 30+ vehicle-category × route combinations.
```

### 2.7 Holiday Packages

```
Build HOLIDAY PACKAGES.
Search: destination, departure city, month, duration, budget-per-person,
theme (honeymoon/family/adventure/pilgrimage/beach/wildlife/luxury).
Listing: cards with hero image, nights/days, cities covered chips, inclusions
icons (flight/hotel/transfer/meals/sightseeing), starting price, "customisable"
badge. Filters: budget slider, duration, theme, hotel category, inclusions.
Detail: day-by-day itinerary accordion with images and activity lists, hotels
per city with swap options, full inclusions/exclusions lists, cancellation
policy, visa requirement note, FAQ, and a "Customise this package" panel that
lets the user change hotel category, add nights, or add activities and updates
the price live.
Then traveller form, review, 25% booking-amount payment option, confirmation.
Mock data: 40+ packages — 20 domestic, 20 international.
```

### 2.8 Tours & Activities

```
Build TOURS & ACTIVITIES.
Search: city, date, category (sightseeing/adventure/water sports/theme parks/
cultural/food tours/day trips/tickets & passes).
Listing: card with image, duration, "free cancellation" and "instant
confirmation" badges, rating, price from. Filters: price, duration, time of
day, category, rating, language of guide.
Detail: highlights, what's included/excluded, meeting point, timeslot picker,
ticket-type selector (adult/child/senior/family), what to bring, cancellation
policy, reviews.
Then quantity + timeslot → traveller form → pay → e-voucher with QR.
Mock data: 60+ activities across 15 cities.
```

### 2.9 Cruises

```
Build CRUISES.
Search: departure port, destination region, month, duration, guests.
Listing: cruise line, ship name, nights, itinerary ports as a chip trail,
sailing dates, price from per person. Filters: cruise line, duration, region,
departure port, price, cabin type.
Detail: ship gallery, deck-by-deck highlights, day-wise itinerary with port
arrival/departure times and sea days, dining and entertainment sections,
onboard amenities.
Cabin select: Interior / Ocean View / Balcony / Suite — each with sqft, deck,
occupancy, perks, and price. Then guest form (passport details required),
add-ons (shore excursions, drinks package, wifi), pay, confirmation.
Mock data: 20+ sailings — Cordelia domestic plus international lines.
```

### 2.10 Visa Services

```
Build VISA SERVICES.
Landing: country grid with flag, visa type badge (e-Visa / Sticker /
Visa-on-arrival / Visa-free), processing time, fee, and a search + region filter.
Country detail: visa types table, step-by-step process timeline, document
checklist by applicant type (salaried/self-employed/student/minor/retired)
with download-sample links, fee breakup (embassy fee + service fee + GST),
processing timeline, validity/stay duration, rejection reasons, FAQ.
Apply flow: applicant count → per-applicant form (passport number, expiry,
DOB, travel dates) → document upload UI (drag-drop, file-type validation,
mock upload progress, per-doc status chips) → review → pay → application
tracking page with a 5-stage status stepper.
Mock data: 30+ countries.
```

### 2.11 Forex Cards & Currency Exchange

```
Build FOREX.
Tabs: Buy Forex Card / Reload Card / Buy Currency Notes / Sell Currency /
Send Money Abroad.
Live-style rate board: 20+ currencies with buy rate, sell rate, day change
(green/red), last-updated timestamp, and a search filter.
Currency converter widget with swap button and instant recalculation.
Card products: comparison of 3–4 multi-currency card variants — issuance fee,
reload fee, ATM withdrawal fee, cross-currency markup, supported currencies,
insurance cover — in a comparison table.
Order flow: currency + amount → live conversion with fee breakup (rate,
GST slab on forex, TCS note, delivery fee) → delivery vs branch pickup →
KYC form (PAN, passport, travel date, purpose of travel) → document upload →
pay → order tracking.
Mock data: 20+ currencies, 4 card products, 6 city branch locations.
```

### 2.12 Travel Insurance

```
Build TRAVEL INSURANCE.
Search: destination region, trip dates, traveller ages, trip type
(single/multi-trip/student).
Listing: 12+ plans across 5 insurers with sum insured, premium, and a
key-benefit chip row. Filters: insurer, sum insured, premium range, coverage
type. Include a side-by-side comparison drawer for up to 3 plans.
Detail: full coverage table (medical, hospitalisation, baggage loss, trip
delay, trip cancellation, passport loss, personal liability), deductibles,
exclusions, claim process, pre-existing disease clause.
Then traveller form (nominee details, medical declaration checkboxes) →
review → pay → policy document download.
Mock data: 12+ plans, premiums ₹400–₹9,000 depending on age/duration/region.
```

### 2.13 Offers & Promotions

```
Build OFFERS & PROMOTIONS landing page.
Coupon listing: grid of offer cards with code, discount %, max discount,
min spend, expiry, vertical eligibility (flights/hotels/buses, etc.), and
"Show terms" accordion.
Search/filter: by vertical, by discount range, by expiry (expiring soon).
Detail modal: terms, T&Cs, fine print, coupon code copy button, "Apply to
my next booking" CTA.
Coupon validation: when applying in checkout, show error if: expired,
minimum spend not met, already used, or not eligible for vertical. Show
success toast with discount amount.
Coupon list: max 10 visible, pagination or "load more".
Mock data: 10–15 active coupons with mixed eligibility (e.g., "flights +
hotels", "first booking only", "min ₹10k spend").
```

### 2.14 Help & Support

```
Build HELP & SUPPORT page with:
FAQ accordion grouped by category: Booking, Cancellation, Refunds, Payments,
Account, Technical. 15–20 FAQs total. Search box to filter FAQs by keyword.
Contact form: name, email, phone, category dropdown (booking issue, refund,
feedback, complaint), message, attachment upload. Mock 2s submission delay,
then "Ticket #123456 created, we'll reply in 2 hours" success state.
Support channels: live chat simulation (mock messages, 3s response delay),
email, phone numbers listed.
Ticket tracker: list past support tickets with status (open, resolved, closed),
date, subject, mock-fetch recent ticket details.
Common issues carousel: 5 quick-solve cards (e.g., "How to cancel a booking",
"Track my refund", "Reset password").
Mock data: 3–5 open support tickets, 10+ resolved tickets in history.
```

### 2.15 Home Page (Complete Flow)

```
Build HOMEPAGE fully wired end-to-end:
1. Hero section with search tabs (one per vertical — flights, hotels, buses,
   trains, cabs, packages, activities, cruises, visa, forex, insurance).
   Each tab has a search widget specific to that vertical.
2. Popular destinations carousel (6–8 cities with background images, 
   clicking navigates to that vertical's search results pre-filled).
3. Offers carousel (3–5 offer cards with CTA, clicking navigates to
   /offers with that coupon auto-selected).
4. "Why book with us" section (trust badges, guarantees).
5. Recent searches (if logged in, show last 5 searches across all verticals).
6. Deals carousel (flight deals, hotel deals, bus deals — sampled from mock data,
   sorted by discount or expiring soon).
Mock data fully wired: clicking any destination, deal, or offer navigates to
the relevant listing page with filters pre-applied and results loading.
```

---

## PART 3 — Wrap-Up Prompt (paste last)

```
Now finish the platform. All of these must be fully wired, not partially stubbed:

1. MY TRIPS — unified booking store in localStorage. Every completed booking
   from all 15 modules (auth + 12 verticals + profile) lands here with a 
   vertical-specific card. Tabs: Upcoming / Completed / Cancelled / Failed.
   Show booking ID, dates, status, price, vertical icon, "View details" CTA.
   Sync across browser tabs (localStorage events).

2. BOOKING DETAIL + CANCELLATION REFUND — tap "Cancel booking" on any trip.
   Show the vertical's cancellation policy. Calculate refund by applying
   policy (e.g., "100% refund if cancelled >7 days before", "₹500 cancellation
   fee if <24 hours", "Non-refundable"). Display breakdown: original price,
   deduction, final refund amount. Require reason dropdown + confirmation modal.
   Mock cancellation with 2s delay, then mark as "Cancelled" in My Trips.
   Show refund timeline (e.g., "refund in 5–7 working days").

3. PAYMENT INTEGRATION (centralized) — payment modal shown in review step
   across all verticals. Methods: UPI, Credit Card, Debit Card, Net Banking,
   Wallet (mock balance ₹50,000), Pay at Hotel/Counter (for hotels/packages).
   Each method: input form (if needed) → "Processing..." 2s delay → success.
   Mock payment failures (10% chance) with retry option. Store payment method
   in saved cards if "Save for next time" checked. Show transaction ID on success.

4. DOWNLOAD & EXPORT — every confirmation page has "Download" buttons:
   - Flights: e-ticket PDF (PNR, QR code, itinerary, baggage allowance)
   - Hotels: voucher PDF (confirmation code, check-in instructions, map)
   - Buses: e-ticket (seat layout, PNR, T&Cs)
   - Trains: e-ticket PDF (PNR, coach/berth, cancellation rules)
   - Cabs: booking summary (driver details pending state, GPS tracking link mock)
   - Others: appropriate format per vertical.
   Mock PDF generation using jsPDF (placeholder, not real PDF). Show download
   progress toast.

5. NOTIFICATIONS & EMAIL MOCKING — after each booking, display toast:
   "Confirmation sent to your email" (mock, no real email). Show notification
   history in profile if time permits.

6. SEARCH-STATE PERSISTENCE — search params live in URL query string.
   Example: /flights?from=DEL&to=BOM&date=2024-12-25&passengers=2&class=economy
   Sharing this URL should load with pre-filled search and results.
   Listing pages refresh-safe (filters survive F5).

7. DARK MODE — toggle in header. Light theme (white bg, dark text) and dark
   theme (dark bg, light text). Persist to localStorage. On first visit, check
   prefers-color-scheme. CSS variables in theme.scss switch both states.

8. SAVED TRAVELLERS & CARDS — auto-populate forms with saved data from profile.
   Show radio buttons to select, or "Add new" to enter manually.

9. CART/WISHLIST (optional but nice) — add-to-cart on flight/hotel cards,
   show cart count in header. Cart page lists items, can remove, can proceed
   to first item's review (batch booking not required, but nice).

10. ANALYTICS LOGGING (mock) — log key events to browser console:
    - User logged in
    - Search performed (vertical, params)
    - Listing page viewed
    - Booking completed (vertical, amount)
    - Cancellation processed
    Include timestamps and event IDs for tracking.

11. FINAL AUDIT PASS — walk all 12 + 3 cross-cutting modules and confirm:
    ✓ No dead links or 404s (every CTA navigates to a real page)
    ✓ No "No data available" text (empty states designed, filters suggest alternatives)
    ✓ No missing images (every img has src, alt, width/height, onError fallback)
    ✓ No console errors or warnings (check DevTools)
    ✓ No unhandled promise rejections
    ✓ Every form validates (required fields, email format, date logic, min/max)
    ✓ Every async view has loading skeleton, loaded state, error-with-retry
    ✓ Keyboard navigation: tab through entire flow, arrow keys in modals/pickers,
      Enter to submit forms, Esc to close modals
    ✓ Complete a full booking with keyboard only (no mouse)
    ✓ Verify responsive: 360px (mobile), 768px (tablet), 1024px, 1440px (desktop)
    ✓ Check BOTH light and dark themes render correctly
    ✓ Verify localStorage persistence: refresh, bookmark, share URL
    ✓ No unneeded re-renders (React DevTools Profiler)
    ✓ Axe accessibility audit: 0 violations, 4.5:1 contrast in both themes
    
    DELIVER: a markdown file listing every issue found and fixed during audit.
```

---

## Implementation Checklist & Order

**RECOMMENDED SEQUENCE:**
1. **PART 1 (Foundation)** — Complete before anything else. Sets up routing, theme, mock API, shared components.
2. **PART 2.0 (Auth, Profile, Global Search)** — Unblock all subsequent modules. Must work before other flows.
3. **PART 2.1 (Flights)** — Richest module, template for all others. Master this before scaling.
4. **PART 2.2–2.9 (Hotels, Buses, Trains, etc.)** — Adapt flight patterns. Each should take 1–2 sessions.
5. **PART 2.10–2.15 (Visa, Forex, Insurance, Offers, Help, Home)** — Service-based or simpler flows. Reuse components.
6. **PART 3 (Wrap-up)** — Glue everything together, payment layer, My Trips, cancellations, dark mode, audit.

**TIME ESTIMATE:** 4–6 days (full-time) for a single skilled engineer, or 2–3 weeks (part-time).

---

## Technical Consistency Rules

**Mock API Contract** — every `mockApi.get()` call should:
- Take `(path, params)` → `Promise<{ data, error?, metadata? }>`
- Resolve after 400–900ms random delay
- Return realistic data shape matching real API (include pagination if >20 results)
- Throw on invalid params (missing required fields) with user-friendly error

**Form Validation** — every form (search, traveller details, profile edit, etc.) should:
- Use react-hook-form + Zod schema
- Validate on blur + on submit
- Show field-level errors inline (not a toast)
- Disable submit button while validating or submitting
- Show loading spinner on submit

**Loading States** — every async view (listing, detail, payment) should:
- Show skeleton shimmer while loading (not spinner)
- Show "Retrying..." and retry button on error
- Never show "No data" — show designed empty state + suggestions instead

**Price Display** — across all verticals, prices should:
- Format as ₹1,23,456 (Indian numbering)
- Include tax/fee breakup in review step
- Apply coupon discount live
- Show "from ₹X" on cards, exact in detail/review

**Date Handling** — across all verticals:
- Use date-fns for all date logic
- Validate: checkout > checkin (hotels), return > departure (flights), etc.
- Show date in readable format: "25 Dec 2024 (Wed)"
- Preserve timezone context (for flights crossing zones)

---

## Notes on External Resources

- **magnific.com** is Magnific AI — an image upscaler/generator, not a stock library. Use **Unsplash** and **Pexels** as above; **Pixabay** and **picsum.photos** are good fallback options.
- Hotlinking Unsplash/Pexels is fine for a demo or portfolio piece. For production, download, optimize, and serve locally.
- Do not clone MakeMyTrip's logo, exact colour palette, or copy. Match the *flow and information architecture*; give it your own brand identity.
- If your AI context is small, run Part 2 modules in separate sessions and re-paste a condensed Part 1 summary at the top of each.
- **Testing recommendation:** Add mock endpoints for payment success/failure (randomized 10% failure rate to test error handling).
- **Accessibility minimum:** Run Axe audit at the end (0 violations, 4.5:1 contrast, keyboard navigation must work for full booking flow).

---

## Common Pitfalls to Avoid

1. **Don't stub the flow** — if it's listed, it must be clickable and wired end-to-end.
2. **Don't hardcode mock data in components** — centralize all data in `src/mocks/data/` and call `mockApi`.
3. **Don't show "no data" — always design an empty state with actionable suggestions.
4. **Don't skip loading states** — users need visual feedback that something is happening.
5. **Don't use inline styles** — use SCSS modules + CSS variables for consistency.
6. **Don't duplicate validation logic** — validation rules should live in Zod schemas, shared across form + display.
7. **Don't forget localStorage** — auth tokens, search state, dark mode, saved travellers all need persistence.
8. **Don't ignore keyboard navigation** — every interaction (tabs, date pickers, modals) must support keyboard.
9. **Don't create one-off components** — extract and reuse (SearchWidget, FilterRail, PriceBreakup, etc.).
10. **Don't mix responsibilities** — separate API/data layer, state management, and UI layers cleanly.
