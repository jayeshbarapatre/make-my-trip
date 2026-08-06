# Flight Vendor System - Implementation Guide

## Overview
Complete flight vendor approval workflow with admin review and public visibility controls.

## System Flow

### 1. Admin Creates Flight Vendor
**URL:** `/admin/vendors`
- Click "Register New Vendor"
- Select **Vendor Type: Flight Vendor**
- Provide: Name, Email, Phone, Password (8+ chars)
- System creates account with temporary password

### 2. Vendor Logs In
**URL:** `/vendor/login`
- Use email and temporary password
- Recommended: Change password on first login

### 3. Vendor Adds Flight (Draft Mode)
**URL:** `/vendor/flights/create`
- Fill flight details:
  - Airline name, Flight number
  - Source/Destination cities
  - Departure/Arrival times
  - Duration, Price, Available seats
- Status: **DRAFT**
- Can edit/delete at any time

### 4. Vendor Submits for Approval
**URL:** `/vendor/flights`
- Click "Submit for Approval" on DRAFT flight
- Status changes to: **PENDING_APPROVAL**
- Admin is notified

### 5. Admin Reviews & Decides
**URL:** `/admin/flight-approvals`

#### ✅ APPROVE
- Flight status → **APPROVED**
- Flight becomes **visible in user search**
- Vendor sees flight is live

#### ❌ REJECT
- Flight status → **REJECTED**
- Provide rejection reason
- Vendor sees reason and can edit/resubmit

### 6. Important: Edit Approved Flight
When vendor edits an **APPROVED** flight:
- Status automatically reverts → **PENDING_APPROVAL**
- Flight hidden from user search until re-approved
- **Prevents unauthorized price/details changes**

### 7. User Views Approved Flights
**URL:** `/flights/results`
- Search flights (source, destination, date)
- Only **APPROVED** flights are shown
- Vendor info included in flight details

## API Endpoints

### Vendor Flight Management
```
POST   /api/v1/vendor/flights              — Create flight (DRAFT)
GET    /api/v1/vendor/flights              — List vendor's flights
GET    /api/v1/vendor/flights/:id          — Get flight details
PUT    /api/v1/vendor/flights/:id          — Update flight (reverts APPROVED → PENDING)
DELETE /api/v1/vendor/flights/:id          — Delete flight (DRAFT/REJECTED only)
PATCH  /api/v1/vendor/flights/:id/submit   — Submit for approval
PATCH  /api/v1/vendor/flights/:id/toggle   — Toggle active/inactive
```

### Admin Approval
```
GET    /api/v1/admin/approvals/flights           — Get pending flights
PATCH  /api/v1/admin/approvals/flights/:id/approve  — Approve flight
PATCH  /api/v1/admin/approvals/flights/:id/reject   — Reject with reason
```

### Public Flight Search
```
GET    /api/v1/flights                     — Search (filters APPROVED + isActive)
  ?from=Delhi&to=Mumbai&date=2025-12-25&passengers=2
```

## Database Schema

### Flight (Prisma)
```
id              String     @id @default(uuid())
vendorId        String?    @relation to User
airline         String
flightNumber    String     @unique
from            String     (departure city)
to              String     (arrival city)
departureTime   String     (HH:MM format)
arrivalTime     String     (HH:MM format)
durationMinutes Int
price           Float      (per passenger)
seatsAvailable  Int
listingStatus   String     DRAFT | PENDING_APPROVAL | APPROVED | REJECTED
rejectionReason String?    (only if REJECTED)
submittedAt     DateTime?  (when submitted for approval)
approvedAt      DateTime?  (when approved)
approvedBy      String?    (admin ID)
isActive        Boolean    (toggle inactive without deleting)
```

### Status Transitions
```
DRAFT
  ├─ [Edit]     → DRAFT (no status change)
  ├─ [Delete]   → DELETED
  └─ [Submit]   → PENDING_APPROVAL

PENDING_APPROVAL
  ├─ [Approve]  → APPROVED
  └─ [Reject]   → REJECTED (with reason)

APPROVED
  ├─ [Edit]     → PENDING_APPROVAL (CRITICAL: prevents unauthorized changes)
  └─ [Delete]   → Cannot delete

REJECTED
  ├─ [Edit]     → REJECTED (stays rejected)
  └─ [Submit]   → PENDING_APPROVAL (resubmit for re-review)
```

## Frontend Routes

### Vendor Portal
- `/vendor/dashboard` — Flight vendor dashboard
- `/vendor/flights` — My Flights (list/status)
- `/vendor/flights/create` — Add new flight
- `/vendor/flights/:id/edit` — Edit flight

### Admin Portal
- `/admin/vendors` — Create/manage vendors
- `/admin/flight-approvals` — Review pending flights

### Public
- `/flights/results` — Search flights (approved only)

## Security Features

1. **Vendor Authentication**
   - JWT token based
   - Vendor can only see/edit their own flights
   - `authenticateVendor` + `vendorOnly` middleware

2. **Admin Authentication**
   - Separate admin JWT
   - Role-based access control
   - `authenticateAdmin` + `adminOnly` middleware

3. **Status Enforcement**
   - Only DRAFT/REJECTED can be submitted
   - Only APPROVED can be edited (with status revert)
   - Public search filters by `listingStatus = APPROVED`

4. **Data Integrity**
   - Vendor approval prevents unauthorized price changes
   - Rejection reasons documented
   - Submission timestamps recorded

## Testing Checklist

### Vendor Flow
- [ ] Admin creates flight vendor (type = "flight")
- [ ] Vendor logs in
- [ ] Create flight → Status: DRAFT
- [ ] Edit flight → Status: DRAFT
- [ ] Submit for approval → Status: PENDING_APPROVAL
- [ ] Edit APPROVED flight → Auto reverts to PENDING_APPROVAL
- [ ] Delete DRAFT flight
- [ ] Cannot delete APPROVED flight

### Admin Flow
- [ ] View pending flights
- [ ] Approve flight → becomes visible in search
- [ ] Reject flight with reason → vendor sees reason
- [ ] Resubmit rejected flight

### Public Flow
- [ ] Search shows only APPROVED flights
- [ ] Search hides DRAFT/PENDING/REJECTED flights
- [ ] Vendor info visible in flight details

## Future Enhancements

1. **Seat Classes** — Economy/Business/First with different pricing
2. **Email Notifications** — Approval/rejection alerts to vendor
3. **Booking Management** — Vendor dashboard for passenger bookings
4. **Analytics** — Vendor performance metrics
5. **Document Verification** — Business license/registration checks

## Environment Variables Required

```
JWT_SECRET=your-secret-key
DATABASE_URL=mongodb://...
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

## Development Commands

```bash
# Backend
cd makemytrip-backend
npm run dev              # Start with hot-reload

# Frontend
cd makemytrip-frontend
npm run dev              # Start dev server (port 5173)

# Backend available at: http://localhost:5000/api/v1
# Frontend available at: http://localhost:5173
```
