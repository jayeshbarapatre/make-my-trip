# Hotel Details Page Specification & Architecture

This document outlines the architecture, features, data model, and component hierarchy of the **Hotel Details Page (`HotelDetailsPage.jsx`)** implemented within the MakeMyTrip SaaS platform.

---

## 1. Overview & Navigation Flow

The Hotel Details Page serves as the primary conversion funnel for luxury stays, heritage homestays, villas, and apartments. It is accessed dynamically via the Hotel Listing/Results page.

### Navigation Trigger
When a user clicks on any property card (`<HotelCard />` on desktop or `<MobileApp />` article on mobile), the application executes:
```javascript
navigate(`/hotels/detail/${hotel.id}`, { state: { hotel } })
```

### Route Configuration (`App.jsx`)
```javascript
<Route path="/hotels/detail/:hotelId" element={<HotelDetailsPage />} />
```

---

## 2. Component Layout & Visual Structure

The page follows a modern, premium MakeMyTrip design language structured around a 1200px container grid.

```
┌──────────────────────────────────────────────────────────┐
│ Breadcrumb Navigation (Hotels › Udaipur Stays › Name)    │
├──────────────────────────────────────────────────────────┤
│ Header: Title, Star Rating, Locality, Luxe Tags, Actions │
├──────────────────────────────────────────────────────────┤
│ Premium Image Gallery Slider (Main Display + Thumbnails) │
├───────────────────────────────────┬──────────────────────┤
│ Main Content Column (Left)        │ Sticky Sidebar       │
│                                   │ Booking Card (Right) │
│ • About Property (Review/Perks)   │                      │
│ • Premium Amenities Grid          │ • Total Price Calc   │
│ • Choose Your Room (Room Types)   │ • Date Pickers       │
│ • Verified Guest Reviews          │ • Guest Count Input  │
│                                   │ • "Instant Reserve"  │
└───────────────────────────────────┴──────────────────────┘
```

---

## 3. Core Features & Functional Specs

### A. Image Gallery Slider
- **Main Hero Image**: 1200px wide high-resolution viewport with smooth 0.5s CSS zoom on hover.
- **Navigation Controls**: Floating left/right circular glassmorphism buttons (`‹` / `›`) that cycle through available property images.
- **Auto-Slide**: Configured with a `setInterval` timer that automatically advances slides every 5 seconds.
- **Interactive Thumbnails Track**: Horizontal scrollable strip of thumbnails below the hero image. Clicking any thumbnail instantly updates the main hero display.

### B. Property Information & Perks
- **Header**: Large bold typography (`32px`, `font-weight: 800`), location metadata, and instant sharing/wishlist triggers.
- **MMT Luxe Tags**: Visual markers denoting verified 5-star host status and couple-friendly amenities.
- **Long Stay Benefits**: Renders conditional promotional incentives (e.g., airport transfers, laundry, long-stay discounts).

### C. Room Booking Section
- Displays available room tier options (e.g., *Luxury Heritage Suite* vs. *Royal Maharaja Suite*).
- Each tier card highlights dedicated room amenities (King size bed, plunge pool access).
- Scarcity indicators display real-time availability (`⚡ Only 2 Rooms Left` vs. `✓ Available On Instant Confirmation`).

### D. Premium Amenities Grid
- 8-column responsive grid showcasing top-tier facilities:
  - 📶 High-Speed WiFi
  - 🏊 Infinity Pool
  - 🅿️ Valet Parking
  - ❄️ Air Conditioning
  - 🍽️ Fine Dining
  - 💆 Spa & Wellness
  - 🛎️ 24/7 Room Service
  - 🍹 Bar & Lounge

### E. Verified Guest Reviews
- Renders genuine feedback from past guests in an elegant card layout.
- Displays reviewer initials avatar, full name, stay category (Family Trip / Couple Stay), and numeric rating badge (`★ 5.0`).

### F. Sticky Booking Sidebar
- **Fixed Position**: Uses `position: sticky; top: 90px;` so the pricing panel remains accessible as the user scrolls through property details.
- **Live Calculator**: Breaks down nightly base rates multiplied by stay duration, adding taxes and service fees to provide a clear, transparent "Total Billed" amount.
- **Instant Reserve Trigger**: Clicking "Instant Reserve Now" verifies user authentication state. If unauthenticated, it presents a seamless OTP modal to log the user in before finalizing the reservation.

---

## 4. Design & Aesthetic Guidelines

1. **Spacing Grid**: Strictly maintains 8px / 16px / 24px / 32px spacing rules for visual harmony.
2. **Typography**: Utilizes bold weight headers (`Space Grotesk`) with soft slate-gray body text (`#475569`) for maximum readability.
3. **Card Shadows**: Features delicate, elevated box shadows (`0 10px 30px rgba(0,0,0,0.04)`) with crisp borders (`#e2e8f0`).
4. **Responsive Breakpoints**:
   - `≤ 1024px`: Collapses grid into a single-column layout; sidebar transitions from sticky to fluid block.
   - `≤ 640px`: Adjusts hero image height to `300px` and title sizing to `24px` for optimal mobile viewing.
