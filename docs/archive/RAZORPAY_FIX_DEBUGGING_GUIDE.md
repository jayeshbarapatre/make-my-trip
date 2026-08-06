# 🔧 Razorpay Integration Debugging Guide

## ✅ WHAT WAS BROKEN & FIXED

### Before (BROKEN ❌)
```javascript
// BookingPage.jsx - OLD CODE
const handlePaymentSubmit = (e) => {
  // ❌ Just showed loading spinner
  setPaymentLoading(true)
  setTimeout(() => {
    setPaymentLoading(false)
    setStep(4) // Direct to confirmation - NO PAYMENT!
  }, 3000)
}
```

### After (FIXED ✅)
```javascript
// BookingPage.jsx - NEW CODE
const handlePaymentSubmit = async (e) => {
  // 1️⃣ Create order on backend
  const orderResponse = await fetch('/api/v1/payment/create-order', {
    body: { amount: 5000 } // Amount in rupees
  })
  
  // 2️⃣ Get orderId from response
  const orderId = orderResponse.data.orderId
  
  // 3️⃣ Open Razorpay popup
  new window.Razorpay({
    key: KEY_ID,
    order_id: orderId,
    handler: (response) => {
      // 4️⃣ Verify payment on backend
      // 5️⃣ Create booking after verification
    }
  }).open()
}
```

---

## 🧪 TESTING CHECKLIST

### Step 1: Verify Environment Variables

#### Backend (.env)
```bash
cat makemytrip-backend/.env | grep RAZORPAY
# Should show:
# RAZORPAY_KEY_ID=rzp_test_Sqpk2eYSSYrvWf
# RAZORPAY_KEY_SECRET=umxn1sNhqHnT6GUwbzIoztNH
```

#### Frontend (.env.local)
```bash
cat makemytrip-frontend/.env.local | grep RAZORPAY
# Should show:
# VITE_RAZORPAY_KEY_ID=rzp_test_Sqpk2eYSSYrvWf
```

### Step 2: Verify Razorpay Script is Loaded

Open DevTools Console (F12) and paste:
```javascript
// Should return true
window.Razorpay !== undefined
// Output: true ✓
```

If returns `false`, the script didn't load. Check:
- index.html has `<script src="https://checkout.razorpay.com/v1/checkout.js"></script>`
- Browser's Network tab shows script loaded (200 status)

### Step 3: Test Payment Flow

1. **Go to flight booking page**
2. **Fill traveller details** → Click "PROCEED TO PAYMENT"
3. **Open DevTools** (F12) → Console tab
4. **Click "PAY NOW ₹XXXX"**

**Expected Console Output:**

```
📋 Creating Razorpay order...
📋 Creating Razorpay order...  <-- First log
✓ Order created: {orderId: 'order_xxxxx', amount: 500000, currency: 'INR'}
🔓 Opening Razorpay checkout with options: {...}
```

If you see these logs → Script is working! ✓

### Step 4: Open Razorpay Popup

If logs show but popup doesn't open → Check:
1. Popup blockers (Chrome/Firefox settings)
2. DevTools errors (look for red errors in console)
3. `window.Razorpay` is defined (test in console)

### Step 5: Complete Payment

**Test Card Details:**
- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date (e.g., 12/27)
- **CVV**: Any 3 digits (e.g., 123)
- **Name**: Any name

After payment, you should see:
```
✓ Payment successful! {razorpay_payment_id: 'pay_xxxxx', ...}
✓ Payment verified! {success: true, message: '...'}
📝 Creating booking with payment details...
✓ Booking created! {...}
```

Then → Redirects to success page ✓

---

## 🚨 COMMON MISTAKES & FIXES

### ❌ MISTAKE #1: Razorpay Popup Not Opening

**Symptoms:**
- Console shows "Opening Razorpay checkout..." but nothing happens
- No popup appears

**Causes & Fixes:**

1. **Script not loaded**
   ```bash
   # Check index.html
   grep "checkout.razorpay.com" makemytrip-frontend/index.html
   # Should find the script tag
   ```

2. **Popup blocked**
   - Check browser popup settings
   - Disable popup blocker temporarily

3. **Wrong API Key**
   - Check `.env.local` has correct `VITE_RAZORPAY_KEY_ID`
   - Restart dev server: `npm run dev`

### ❌ MISTAKE #2: 404 Error When Creating Order

**Symptoms:**
```
Failed to create payment order
Error: 404 Not Found
```

**Causes & Fixes:**

1. **Backend API not running**
   ```bash
   # Terminal 1: Start backend
   cd makemytrip-backend && npm run dev
   # Should show "Server running on port 5000"
   ```

2. **Wrong API URL in fetch**
   ```javascript
   // ❌ WRONG
   fetch('/payment/create-order')
   
   // ✅ CORRECT
   fetch(`${import.meta.env.VITE_API_BASE_URL}/payment/create-order`)
   ```

3. **CORS issue**
   - Check backend `.env` has correct CORS_ORIGIN
   - Should be: `CORS_ORIGIN=http://localhost:5173`

### ❌ MISTAKE #3: "Razorpay SDK not loaded"

**Symptoms:**
```
Error: Razorpay SDK not loaded. Please refresh the page.
```

**Fix:**
1. Hard refresh the page: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Check Network tab → Script loaded? (200 status)
3. If not: Clear browser cache, restart server

### ❌ MISTAKE #4: Amount Not Converting to Paise

**Symptoms:**
- Payment shows wrong amount in Razorpay
- Amount is 100x larger than expected

**Why:**
Razorpay uses **paise** (1 rupee = 100 paise)

**Fix (Already Done):**
```javascript
// Backend - CORRECT
const amount = 5000 // ₹5000
const amountInPaise = amount * 100 // 500000 paise
```

### ❌ MISTAKE #5: Payment Verified But Booking Not Created

**Symptoms:**
```
✓ Payment verified!
❌ Creating booking failed...
```

**Causes:**
1. Flight/hotel not found → Check flightId/hotelId exists
2. User not authenticated → Check token in localStorage
3. Booking API failing → Check backend /bookings endpoint

**Debug:**
```javascript
// Check auth token
console.log('Token:', localStorage.getItem('token'))

// Check flight data
console.log('FlightID:', flight.id)
console.log('Amount:', totalAmount)
```

---

## 📊 PAYMENT FLOW DIAGRAM

```
┌─────────────────────────────────────────────────────────┐
│  User clicks "PAY NOW ₹5000"                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: POST /api/v1/payment/create-order            │
│  ├─ amount: 5000                                        │
│  ├─ currency: INR                                       │
│  └─ notes: {bookingType, flightId, ...}                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Backend: Create Razorpay Order                         │
│  ├─ Convert amount to paise (5000 * 100 = 500000)     │
│  ├─ Call razorpay.orders.create(options)              │
│  └─ Return: { orderId: 'order_xxxx', amount: 500000 } │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: Open Razorpay Popup                          │
│  └─ new window.Razorpay({ order_id, key, ... }).open() │
└──────────────────┬──────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
    [User Pays]    [User Cancels]
     4111...           │
          │             └→ ondismiss() called
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│  Razorpay Response Handler                              │
│  ├─ razorpay_payment_id: pay_xxxx                      │
│  ├─ razorpay_order_id: order_xxxx                      │
│  └─ razorpay_signature: xxxxx                          │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend: POST /api/v1/payment/verify                  │
│  ├─ orderId                                             │
│  ├─ paymentId                                           │
│  └─ signature                                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────────┐
│  Backend: Verify Payment Signature                      │
│  ├─ Calculate HMAC-SHA256                              │
│  ├─ Compare with provided signature                    │
│  └─ If valid → success: true                           │
└──────────────────┬──────────────────────────────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
      [Valid]         [Invalid]
        │                │
        ▼                ▼
  Create Booking    Show Error
        │
        ▼
  Show Confirmation
  & Success Ticket
```

---

## 🔍 CONSOLE LOGS TO EXPECT

### ✅ Successful Flow

```
📋 Creating Razorpay order...
✓ Order created: {orderId: 'order_EZXAKflC', amount: 500000, currency: 'INR'}
🔓 Opening Razorpay checkout with options: {key: 'rzp_test_...', order_id: 'order_...', ...}
✓ Payment successful! {razorpay_payment_id: 'pay_...', razorpay_order_id: 'order_...', razorpay_signature: '...'}
💳 Payment ID: pay_EZXLqjO5p3v4aH
📋 Order ID: order_EZXAKflC
🔐 Signature: 9ef4dffbfd84f1318f6739ace19f9d85851857ae648f114332d8401e0949a3d
🔐 Verifying payment...
✓ Payment verified! {success: true, message: 'Payment verified successfully', ...}
📝 Creating booking with payment details...
✓ Booking created! {bookingId: 'MMT...', pnr: 'PNR...', ...}
```

### ❌ Failure Points

```
# Script not loaded
❌ Error: Razorpay SDK not loaded. Please refresh the page.

# Order creation failed
❌ Error: Failed to create payment order

# Network error
❌ Failed to create payment order

# Signature mismatch
❌ Payment verified but booking failed

# User cancelled
❌ Payment cancelled by user
```

---

## 🎯 QUICK FIX CHECKLIST

- [ ] Backend running: `npm run dev` in makemytrip-backend/
- [ ] Frontend running: `npm run dev` in makemytrip-frontend/
- [ ] .env has RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET
- [ ] .env.local has VITE_RAZORPAY_KEY_ID
- [ ] index.html has Razorpay script tag
- [ ] Browser console shows no CORS errors
- [ ] Hard refresh the page (Ctrl+Shift+R)
- [ ] Disable popup blockers
- [ ] Use test card: 4111 1111 1111 1111

---

## 📞 IF STILL NOT WORKING

1. **Open DevTools Console (F12)**
2. **Click "PAY NOW" button**
3. **Copy ALL console output** (right-click → Save as → paste below)
4. **Share the exact error message**

Common issues found with logs:
```
500 Internal Server Error → Check backend logs
CORS error → Check CORS_ORIGIN in .env
undefined Razorpay → Script not loading
404 /payment/create-order → Wrong URL
```

---

## ✅ SUCCESS VERIFICATION

After fixing, you should see:

**At Booking Step 3:**
- [ ] "PAY NOW" button visible
- [ ] Click opens Razorpay popup
- [ ] Card form appears in popup

**During Payment:**
- [ ] Razorpay animation
- [ ] Payment processing

**After Payment:**
- [ ] Success toast notification
- [ ] Redirects to step 4 (confirmation)
- [ ] E-ticket shows payment status

🎉 **Payment integration is now working!**
