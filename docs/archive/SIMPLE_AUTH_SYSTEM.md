# SIMPLE & STRICT AUTHENTICATION SYSTEM

## Core Logic (VERY SIMPLE)

### REGISTER
```
INPUT: email + password
PROCESS:
  1. Validate email format
  2. Validate password length (min 6)
  3. Check if email already exists in DB
  4. Hash password with bcrypt
  5. Save user to database
  6. Generate JWT token
OUTPUT: token (user logged in)
```

### LOGIN
```
INPUT: email + password
PROCESS:
  1. Check if email exists in database
  2. Check if password matches (compare hashed password)
  3. Generate JWT token
OUTPUT: token (login success) OR error
```

---

## Database Schema (SIMPLE)

```sql
CREATE TABLE user (
  id        TEXT PRIMARY KEY,
  email     TEXT UNIQUE NOT NULL,
  password  TEXT NOT NULL,
  name      TEXT,
  phone     TEXT,
  is_admin  BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);
```

**IMPORTANT:**
- `email` must be UNIQUE (only one user per email)
- `password` must be HASHED (bcrypt, never plain text)

---

## Backend Implementation

### API Endpoints

#### POST /auth/signup
```javascript
// Request
{
  "email": "abc@gmail.com",
  "password": "password123",
  "name": "ABC User",
  "phone": "9876543210"
}

// Response (Success)
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "abc@gmail.com", ... },
    "token": "eyJhbGc..."
  }
}

// Response (Error)
{
  "success": false,
  "message": "Email already registered."
}
```

#### POST /auth/login
```javascript
// Request
{
  "email": "abc@gmail.com",
  "password": "password123"
}

// Response (Success)
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "abc@gmail.com", ... },
    "token": "eyJhbGc..."
  }
}

// Response (Error)
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

## Controller Code (SIMPLE)

```javascript
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../config/prismaClient.js'

const JWT_SECRET = process.env.JWT_SECRET

const signToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' })
}

// REGISTER
export const register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body

    // 1. Validate email & password
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required.' })
    }

    // 2. Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' })
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // 4. Save user to database
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || 'User',
        phone: phone || '0000000000'
      }
    })

    // 5. Generate token
    const token = signToken(user.id)

    res.status(201).json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token }
    })
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.' })
  }
}

// LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // 1. Check if email exists in database
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // 2. Check if password matches
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    // 3. Generate token
    const token = signToken(user.id)

    res.json({
      success: true,
      data: { user: { id: user.id, email: user.email, name: user.name }, token }
    })
  } catch (err) {
    res.status(500).json({ message: 'Login failed.' })
  }
}
```

---

## Frontend Implementation (SIMPLE)

```javascript
// authService.js
import api from './api'

export const authService = {
  register: (data) => api.post('/auth/signup', data),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout')
}
```

```javascript
// Login Component
const handleLogin = async (email, password) => {
  try {
    const res = await authService.login(email, password)
    const token = res.data.token
    const user = res.data.user
    
    // Save token and user
    localStorage.setItem('token', token)
    
    // Login successful
    navigate('/')
  } catch (err) {
    // Show error
    setError('Invalid email or password.')
  }
}
```

---

## Common Mistakes That Cause Login Failure

### ❌ Mistake 1: Storing Plain Text Password
```javascript
// WRONG
const user = await prisma.user.create({
  data: {
    email,
    password: password  // ❌ Plain text!
  }
})

// CORRECT
const hashedPassword = await bcrypt.hash(password, 10)
const user = await prisma.user.create({
  data: {
    email,
    password: hashedPassword  // ✅ Hashed
  }
})
```

### ❌ Mistake 2: Not Checking Email Uniqueness
```javascript
// WRONG
const user = await prisma.user.create({
  data: { email, password: hashedPassword }
  // If same email registered twice, will fail!
})

// CORRECT
const existing = await prisma.user.findUnique({ where: { email } })
if (existing) {
  return res.status(409).json({ message: 'Email already registered.' })
}
```

### ❌ Mistake 3: Comparing Plain Text with Hashed
```javascript
// WRONG
const isValid = password === user.password
// Will never match because user.password is hashed!

// CORRECT
const isValid = await bcrypt.compare(password, user.password)
```

### ❌ Mistake 4: Not Validating Email Format
```javascript
// WRONG
const user = await prisma.user.create({
  data: { email, password: hashedPassword }
  // "abc" or "invalid-email" will be accepted!
})

// CORRECT
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
if (!emailRegex.test(email)) {
  return res.status(400).json({ message: 'Invalid email format.' })
}
```

### ❌ Mistake 5: Generic Error Messages Revealing User Info
```javascript
// WRONG
if (!user) {
  return res.json({ message: 'Email not found.' })  // ❌ Reveals users exist or not
}

// CORRECT
if (!user || !isPasswordValid) {
  return res.status(401).json({ message: 'Invalid email or password.' })
  // ✅ Same message for both cases - more secure
}
```

---

## Debugging Checklist: "Why Can't I Login?"

### 1. Check Database
```sql
-- Verify user exists
SELECT * FROM user WHERE email = 'abc@gmail.com';

-- Check password hash is stored
-- Password should look like: $2b$10$... (bcrypt hash)
```

### 2. Check Registration Succeeded
- Did you see success message when registering?
- Is token in localStorage?
- Did user appear in database?

### 3. Test Login with Backend Tools
```bash
# Test with curl
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"abc@gmail.com","password":"password123"}'

# Should return: { "success": true, "data": { "user": {...}, "token": "..." } }
```

### 4. Check Password Hash
```javascript
// In Node.js console
const bcrypt = require('bcryptjs')

const password = 'password123'
const hash = '$2b$10$...' // from database

bcrypt.compare(password, hash).then(match => {
  console.log(match)  // Should be true
})
```

### 5. Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Login fails with correct email/password | Password stored as plain text | Hash with bcrypt on registration |
| "Email already registered" when registering new user | Email unique constraint works but not checked in code | Use `findUnique()` to check first |
| Can't find user after registration | User created in wrong database | Check `DATABASE_URL` env var |
| Token invalid after login | JWT_SECRET changed | Keep JWT_SECRET constant |
| Blank page after login error | Error not caught properly in frontend | Add try/catch in login handler |

---

## Test Cases

### Test 1: Register Then Login
```
1. Register: abc@gmail.com / password123
2. Expected: User created in DB, token returned
3. Login: abc@gmail.com / password123
4. Expected: Login success ✅
```

### Test 2: Login with Wrong Password
```
1. Register: abc@gmail.com / password123
2. Login: abc@gmail.com / wrongpassword
3. Expected: Error "Invalid email or password." ❌
```

### Test 3: Login with Non-Existent Email
```
1. Login: nonexistent@gmail.com / password123
2. Expected: Error "Invalid email or password." ❌
```

### Test 4: Register Duplicate Email
```
1. Register: abc@gmail.com / password123
2. Register again: abc@gmail.com / different
3. Expected: Error "Email already registered." ❌
```

---

## Summary

**Keep it SIMPLE:**
- Register: email + password → hash + save
- Login: email + password → check DB → success/error
- That's it. No OTP, no mobile login, no extra features.

**Keep it STRICT:**
- Email must be unique
- Password must be hashed
- Error messages don't reveal if email exists
- Always validate inputs

**Make it WORK:**
- Test with actual database
- Check bcrypt hash/compare works
- Verify email uniqueness constraint
- Debug with curl before blaming frontend
