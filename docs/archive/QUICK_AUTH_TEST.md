# Quick Authentication Test - 5 Minutes

## What to Do RIGHT NOW

### 1. Make Sure Backend is Running
```bash
cd makemytrip-backend
npm run dev
```

Wait for: `Server running on http://localhost:5000`

Check mock data is enabled:
```bash
curl http://localhost:5000/health
```

### 2. Check Available Users in Database
```bash
curl http://localhost:5000/api/v1/auth/debug/users
```

You should see 2 users pre-populated:
- `test@makemytrip.com` / `test@1234`
- `demo@makemytrip.com` / `demo@1234`

### 3. Start Frontend
```bash
cd makemytrip-frontend
npm run dev
```

Open: `http://localhost:5173`

### 4. Test Login
1. Go to `/login`
2. Email: `test@makemytrip.com`
3. Password: `test@1234`
4. Click Login
5. **Expected**: "You have successfully logged in" toast appears

### 5. Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Run: `JSON.parse(localStorage.getItem('userId'))`
4. **Expected**: Should show `"test-user-1"` (the user ID)

### 6. Check localStorage
```javascript
// In browser console:
localStorage.getItem('token')        // Should show a long JWT token
localStorage.getItem('userId')       // Should show "test-user-1"
localStorage.getItem('userEmail')    // Should show "test@makemytrip.com"
```

### 7. Test My Trips
1. Navigate to `/my-trips` (or click My Trips in nav)
2. **Expected**: Page loads without errors
3. **If no bookings**: Shows "No trips found" - that's OK
4. **If you have bookings**: They all should be linked to `test-user-1`

### 8. Create a Booking & Test Persistence
1. Go to homepage
2. Search for a flight (e.g., Delhi to Mumbai, any date)
3. Click Book Now on a flight
4. Fill passenger details
5. Complete booking
6. **Expected**: Get a confirmation page

7. Go to My Trips
8. **Expected**: Your new booking appears in the list

### 9. Test Logout & Re-login
1. Click Logout
2. localStorage should be cleared: `localStorage.getItem('token')` returns `null`
3. Go to Login again
4. Enter same credentials: `test@makemytrip.com` / `test@1234`
5. Click Login
6. **Expected**: Login works, you're logged back in

### 10. Test Booking Persistence
1. Go to My Trips
2. **Expected**: The booking you created earlier is still there
3. This proves bookings persisted to the database and are linked to your user account

## What Should Happen in Backend Logs

### When you login:
```
✅ Login: Found user test@makemytrip.com with ID test-user-1
✅ Login successful for test@makemytrip.com (ID: test-user-1)
```

### When you create a booking:
```
✅ Booking: Creating booking for user test-user-1, type: flight
✅ Booking created: ID MMT-FL-123456 for user test-user-1
```

### When you load My Trips:
```
📋 Fetching bookings for user test-user-1
✅ Found X bookings for user test-user-1
```

## If Something is Wrong

### "User not found" at login
**Fix**: Make sure you're entering correct email/password:
- Email: `test@makemytrip.com` (not just `test`)
- Password: `test@1234`

### My Trips shows no bookings after I created one
**Check**:
1. Is `userId` in localStorage? Run in console: `localStorage.getItem('userId')`
2. Look at backend logs - is booking being created with correct userId?
3. Does the Authorization header have the Bearer token?

### Login works but localStorage is empty
**Check**:
1. Did you actually get the "logged in" toast?
2. Open DevTools → Application → Local Storage → Check all three: token, userId, userEmail
3. If any are missing, the response from login endpoint is incomplete

## IMPORTANT NOTES

1. **In-Memory Database**: User data only persists while backend is running
   - When you restart backend: Users reset to pre-populated test users
   - In production: MongoDB/Firestore will persist permanently

2. **Test Users Are Pre-Populated**
   - You don't need to sign up to test
   - Just use `test@makemytrip.com` / `test@1234`
   - Bookings you create ARE saved in the in-memory database

3. **New Registrations**: If you want to test sign up
   - Go to `/signup`
   - Create account with new email (e.g., `newemail@example.com`)
   - Will show in `/api/v1/auth/debug/users` after registration
   - Will persist until backend restart

## Success Criteria

✅ All of these should be true:
- [ ] Can login with test credentials
- [ ] localStorage has token, userId, userEmail
- [ ] Can see My Trips page
- [ ] Can create a booking
- [ ] Booking appears in My Trips
- [ ] Can logout
- [ ] Can login again with same credentials
- [ ] Previous bookings still visible in My Trips
- [ ] Backend logs show userId for each action

If all checks pass: **✅ User Authentication System is Working!**
