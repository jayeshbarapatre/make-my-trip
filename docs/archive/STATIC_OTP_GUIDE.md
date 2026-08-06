# Static OTP System Guide

## What is Static OTP?

A **static OTP** is a fixed, unchanging code used for testing and development purposes. Instead of generating unique, time-based OTPs for each user session, a static OTP remains the same and can be used repeatedly.

### Why Use Static OTP?

- ✅ **No SMS needed** — Don't need a real SMS service during testing
- ✅ **Instant testing** — No waiting for SMS delivery
- ✅ **Predictable** — Same code works every time
- ✅ **Development friendly** — Easy to test auth flows without infrastructure

---

## How to Use Static OTP

### During Development

The system is configured to accept **`123456`** as a static OTP in **development mode** (when `NODE_ENV !== 'production'`).

### Login Flow with Static OTP

1. **Register** a new user (email: `abc@gmail.com`, phone: `9876543210`)
   ```
   POST /api/v1/auth/signup
   {
     "name": "Test User",
     "email": "abc@gmail.com",
     "password": "Password123!",
     "phone": "9876543210"
   }
   ```

2. **Request OTP** via phone or email
   ```
   POST /api/v1/auth/send-otp
   { "phone": "9876543210" }
   
   OR (for password reset)
   
   POST /api/v1/auth/forgot-password
   { "email": "abc@gmail.com" }
   ```

3. **Verify OTP** using static code `123456`
   ```
   POST /api/v1/auth/verify-otp
   {
     "phone": "9876543210",
     "otp": "123456"
   }
   
   OR (for password reset)
   
   POST /api/v1/auth/verify-otp
   {
     "email": "abc@gmail.com",
     "otp": "123456"
   }
   ```

4. **Login** with the verified account
   ```
   POST /api/v1/auth/login
   {
     "email": "abc@gmail.com",
     "password": "Password123!"
   }
   ```

---

## Implementation Details

### Code Changes

Updated `authController.js`:

```javascript
// Email OTP Verification
const isStaticOtpValid = process.env.NODE_ENV !== 'production' && otp === '123456'
const isStoredOtpValid = user.otp === otp && new Date() <= user.otpExpiry

if (!isStaticOtpValid && !isStoredOtpValid) {
  return res.status(400).json({ message: 'Invalid OTP code.' })
}
```

```javascript
// Mobile OTP Verification
const isStaticOtpValid = process.env.NODE_ENV !== 'production' && otp === '123456'
const isStoredOtpValid = user.otp === otp && (!user.otpExpiry || new Date() <= user.otpExpiry)

if (!isStaticOtpValid && !isStoredOtpValid) {
  return res.status(400).json({ message: 'Invalid OTP code.' })
}
```

---

## Frontend Usage (BookingPage OTP Modal)

In your booking flow, when the OTP verification modal appears:

1. **Enter Static OTP**: `123456`
2. **Click "VERIFY & RESUME BOOKING"**
3. Booking will proceed immediately

No need to wait for SMS or email OTP codes during testing!

---

## Production Safety

### When `NODE_ENV=production`:
- Static OTP (`123456`) is **completely disabled**
- Only real, time-limited OTPs are accepted
- System works with actual SMS/email services only

### How to Switch to Production:

Update `.env`:
```
NODE_ENV=production
```

Then:
- Only dynamically generated OTPs will work
- Static OTP checking is skipped
- Full production security is enabled

---

## Testing Checklist

- [ ] Register new user with email/phone
- [ ] Request OTP (SMS or email)
- [ ] Enter `123456` in OTP field
- [ ] Successfully verify and login
- [ ] Proceed with booking flow
- [ ] Complete booking with payment

---

## Key Points

| Feature | Development | Production |
|---------|-------------|-----------|
| Static OTP `123456` | ✅ Accepted | ❌ Rejected |
| Dynamic OTP | ✅ Works | ✅ Required |
| SMS/Email OTP | Optional | ✅ Required |
| Security Level | Testing | Production-grade |

---

## Troubleshooting

**"Invalid OTP code" error**
- Verify you entered `123456` correctly
- Ensure `NODE_ENV` is set to `development`
- Check backend console logs for errors

**Still want real OTP?**
- Request OTP and check backend logs for the generated code
- Use that code instead of static `123456`

**Production concerns?**
- Set `NODE_ENV=production` to disable static OTP completely
- Configure real SMS/email services
- Deploy with confidence that static OTP won't work

---
