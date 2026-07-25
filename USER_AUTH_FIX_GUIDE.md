# User Authentication & Booking Persistence Fix Guide

## Overview
This guide explains the fixes made to ensure users register once, remain logged in, and all their bookings are properly linked to their account.

## What Was Fixed

### 1. **Frontend: Persist User ID on Login/Register**
   - **File**: `makemytrip-frontend/src/context/AuthContext.jsx`
   - **Changes**:
     - Save `userId` to localStorage on login/register
     - Save `userEmail` to localStorage for reference
     - Clear these on logout
   - **Why**: The frontend needs to know the user's ID to fetch their bookings and link new bookings to their account

### 2. **Backend: Profile Endpoint Logic Fix**
   - **File**: `makemytrip-backend/src/controllers/authController.js`
   - **Changes**:
     - Fixed profile endpoint to properly validate and return user data
     - Added check for missing userId in token
     - Properly separated user lookup from response formatting
   - **Why**: The profile endpoint is called on page load to auto-restore the user session

### 3. **Backend: Enhanced Logging**
   - **Files**: 
     - `authController.js` - Registration and login logging
     - `bookingController.js` - Booking creation and retrieval logging
   - **What logs show**:
     - When user registers/logs in: Shows user ID that will be encoded in JWT token
     - When booking is created: Shows which user ID the booking was linked to
     - When My Trips fetches: Shows how many bookings were found for the user
   - **Why**: Makes it easy to debug why bookings aren't appearing

### 4. **Debug Endpoint Added**
   - **Route**: `GET /api/v1/auth/debug/users`
   - **Shows**: All users currently in the mock database (including their IDs)
   - **Usage**: `curl http://localhost:5000/api/v1/auth/debug/users`

## How to Test

### Step 1: Start Both Servers
```bash
# Terminal 1: Frontend
cd makemytrip-frontend
npm run dev

# Terminal 2: Backend
cd makemytrip-backend
npm run dev
```

### Step 2: Check Backend is Ready
```bash
# Should show mock data enabled
curl http://localhost:5000/health

# Should list all registered users (initially shows test users)
curl http://localhost:5000/api/v1/auth/debug/users
```

Expected output:
```json
{
  "message": "Debug: All users in database",
  "count": 2,
  "users": [
    { "id": "test-user-1", "email": "test@makemytrip.com", "name": "Test User", ... },
    { "id": "test-user-2", "email": "demo@makemytrip.com", "name": "Demo User", ... }
  ]
}
```

### Step 3: Test with Pre-Populated Users (No Registration)
1. Open `http://localhost:5173/login`
2. Enter credentials:
   - Email: `test@makemytrip.com`
   - Password: `test@1234`
3. Click "Login"
4. You should see: "You have successfully logged in"
5. Check browser console: Look for logs showing the user ID and token
6. Check backend logs: Should show `✅ Login successful for test@makemytrip.com (ID: test-user-1)`

### Step 4: Test My Trips
1. After logging in, navigate to: `http://localhost:5173/my-trips`
2. Backend logs should show: `✅ Found X bookings for user test-user-1`
3. If no bookings exist, you'll see an empty state (which is correct)

### Step 5: Create a Booking
1. Go to homepage: `http://localhost:5173`
2. Search for flights/hotels/trains
3. Select one and proceed to booking
4. Fill details and complete the booking
5. **Check backend logs** for:
   - `✅ Booking: Creating booking for user test-user-1, type: flight`
   - `✅ Booking created: ID XXX for user test-user-1`
6. Go to My Trips
7. **You should see the booking** linked to your account

### Step 6: Test Registration (New User)
1. Go to `http://localhost:5173/signup`
2. Fill in new credentials:
   - Name: John Doe
   - Email: john@example.com
   - Phone: 9999999999
   - Password: Password@123
3. Click Register
4. **Check backend logs** for:
   - `✅ Registration: Created user john@example.com with ID U-1234567890`
5. You should see: "You have successfully registered"
6. **Check browser console** - localStorage should have:
   - `token` = JWT token
   - `userId` = `U-1234567890` (the ID shown in logs)
   - `userEmail` = `john@example.com`

### Step 7: Logout and Re-login (Test Persistence)
1. Click Logout in the app
2. **Check localStorage** - token/userId should be cleared
3. Go back to `http://localhost:5173/login`
4. Enter the same email and password from Step 6
5. Login should work (user persists as long as backend is running)
6. **Check backend logs**:
   - Should show `✅ Login: Found user john@example.com with ID U-1234567890`
   - NOT "User not found"
7. Go to My Trips - should see the same bookings

### Step 8: Test Booking Persistence After Login
1. Make sure you're logged in as john@example.com
2. Create another booking
3. Go to My Trips - should show multiple bookings all linked to the same user

## Understanding the User ID Flow

```
REGISTRATION
├─ User enters: name, email, password, phone
├─ Backend creates user with ID: U-1234567890 (unique ID)
├─ Backend signs JWT token with ID: jwt.sign({ id: "U-1234567890" }, SECRET)
├─ Frontend receives: { user: { id: "U-1234567890", ... }, token: "eyJ..." }
├─ Frontend saves: localStorage.token = "eyJ..."
├─            AND  localStorage.userId = "U-1234567890"
└─ ✅ User is now registered with a persistent ID

LOGIN (later)
├─ User enters: email, password
├─ Backend finds the registered user by email
├─ Backend verifies password matches
├─ Backend signs JWT token with same ID: jwt.sign({ id: "U-1234567890" }, SECRET)
├─ Frontend receives: { user: { id: "U-1234567890", ... }, token: "eyJ..." }
├─ Frontend saves: localStorage.token = "eyJ..."
├─            AND  localStorage.userId = "U-1234567890"
└─ ✅ User is logged back in with same ID

CREATING BOOKING
├─ Frontend sends: POST /bookings/trains with Authorization header: "Bearer eyJ..."
├─ Backend middleware verifies token: jwt.verify("eyJ...", SECRET)
├─ Backend extracts ID: decoded.id = "U-1234567890" → req.userId = "U-1234567890"
├─ Backend creates booking: { userId: "U-1234567890", type: "train", ... }
└─ ✅ Booking is linked to the correct user

MY TRIPS (later)
├─ Frontend calls: GET /bookings/user/U-1234567890 with Bearer token
├─ Backend extracts: req.userId = "U-1234567890" from token
├─ Backend queries: WHERE userId = "U-1234567890"
└─ ✅ All bookings for that user are returned
```

## Common Issues & Solutions

### Issue: "Email already registered" on login
**Cause**: Frontend tried to register instead of login, or user tried registering twice
**Solution**: Use Login form, not Sign Up form. If email already exists, log in with password

### Issue: Bookings not showing in My Trips
**Cause**: One of several issues:
1. `userId` not in token
2. `userId` not properly extracted from token
3. Booking created without `userId`
4. My Trips querying with wrong userId

**Debug Steps**:
1. Check browser console - does user object have `id` field? `console.log(user)`
2. Check localStorage - does `userId` exist? `localStorage.getItem('userId')`
3. Check backend logs - when creating booking, does it show the user ID?
4. Run debug endpoint: `curl http://localhost:5000/api/v1/auth/debug/users`

### Issue: User lost after browser refresh
**Cause**: Frontend needs to restore session on page load
**Solution**: This is handled by AuthContext.useEffect - it calls profile endpoint if token exists

### Issue: "Authentication required to create booking"
**Cause**: Bearer token not being sent, or userId not in token
**Solution**: 
1. Check network tab - Authorization header present?
2. Check backend logs - what does it show about req.userId and req.user?
3. Verify JWT_SECRET is set in backend .env

## Key Backend Logs to Watch

When registering:
```
✅ Registration: Created user john@example.com with ID U-1234567890
📤 Registration response: { userId: "U-1234567890", email: "john@example.com" }
```

When logging in:
```
✅ Login: Found user john@example.com with ID U-1234567890
✅ Login successful for john@example.com (ID: U-1234567890)
📤 Login response: { userId: "U-1234567890", email: "john@example.com" }
```

When creating a booking:
```
✅ Booking: Creating booking for user U-1234567890, type: flight
✅ Booking created: ID MMT-FL-123456 for user U-1234567890
```

When fetching bookings in My Trips:
```
📋 Fetching bookings for user U-1234567890
✅ Found 3 bookings for user U-1234567890
```

## Testing Checklist

- [ ] Can login with `test@makemytrip.com` / `test@1234`
- [ ] userId is in localStorage after login
- [ ] My Trips page loads (even if empty)
- [ ] Can create a booking while logged in
- [ ] Backend logs show booking linked to user ID
- [ ] Can see booking in My Trips
- [ ] Can logout successfully
- [ ] Can login again with same credentials
- [ ] Previous bookings still visible in My Trips after re-login
- [ ] Can create new booking after re-login
- [ ] New booking is separate from old bookings (both visible in My Trips)

## Notes for Production

1. **Seed Data**: Currently, mock users only persist while backend is running
   - In production, use MongoDB/Firestore to persist users permanently
   - For testing, restart backend to reset to pre-populated test users

2. **JWT_SECRET**: Must be set in `.env` - never hardcode or use default
   - In production, use a strong random string

3. **CORS**: Currently allows localhost:5173
   - In production, restrict to your actual frontend domain

4. **Rate Limiting**: Disabled for testing
   - In production, enable rate limiter on auth endpoints
