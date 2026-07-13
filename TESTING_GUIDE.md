# Testing Guide

Comprehensive testing guide for the MakeMyTrip project.

## Why Testing Matters

1. **Catches Bugs Early** - Automated tests find issues before production
2. **Prevents Regressions** - Tests verify fixes don't break existing features
3. **Documents Behavior** - Tests show how code should work
4. **Enables Refactoring** - Tests provide safety net for code changes
5. **Reduces Manual Testing** - Automation saves time and catches edge cases

## Current Testing Status

**Coverage**: 0% (no automated tests)
**Critical Gap**: Race condition fix is untested
**Risk Level**: HIGH - Must test concurrent operations before production

---

## Testing Pyramid

```
       /\         E2E Tests (UI)
      /  \        10-20% of tests
     /____\
     /\   /\      Integration Tests
    /  \ /  \     30-40% of tests
   /____/____\
   /\  /\  /\    Unit Tests
  /  \/  \/  \   50-60% of tests
 /____________\
```

---

## Critical Test Cases (Must Implement)

### 1. Race Condition - Flight Booking

**Why Critical**: Prevents overbooking

**Test**: Make 2 concurrent requests to book 15 seats on 20-seat flight

```javascript
// Should result in:
// - 1 booking succeeds
// - 1 booking fails with "insufficient seats"
// - Flight seats: 20 - 15 = 5 remaining
```

**Implementation**:
```javascript
describe('Flight Booking - Race Condition', () => {
  it('should prevent overbooking with concurrent requests', async () => {
    const flight = await createTestFlight({ seatsAvailable: 20 })

    const [result1, result2] = await Promise.allSettled([
      createFlightBooking(flight.id, 15),
      createFlightBooking(flight.id, 15)
    ])

    expect(result1.status === 'fulfilled' XOR result2.status === 'fulfilled').toBe(true)
    const finalFlight = await getFlight(flight.id)
    expect(finalFlight.seatsAvailable).toBe(5)
  })
})
```

### 2. Booking Cancellation - Refund Logic

**Why Critical**: Prevents inventory loss

**Test**: Create booking, cancel it, verify seats refunded

```javascript
describe('Booking Cancellation - Refund', () => {
  it('should refund seats when booking cancelled', async () => {
    const flight = await createTestFlight({ seatsAvailable: 100 })
    const booking = await createFlightBooking(flight.id, 5)

    const flightAfterBooking = await getFlight(flight.id)
    expect(flightAfterBooking.seatsAvailable).toBe(95)

    await cancelBooking(booking.id)

    const flightAfterCancel = await getFlight(flight.id)
    expect(flightAfterCancel.seatsAvailable).toBe(100)
  })
})
```

### 3. Admin Account Creation - Security

**Why Critical**: Prevents unauthorized admin creation

**Test**: Verify only existing admins can create new admins

```javascript
describe('Admin Registration - Security', () => {
  it('should allow first admin without auth', async () => {
    const response = await adminRegister({
      name: 'First Admin',
      email: 'admin@test.local',
      password: 'SecurePass123'
    })

    expect(response.status).toBe(201)
  })

  it('should require auth for subsequent admins', async () => {
    await adminRegister({ name: 'Admin 1', email: 'admin1@test.local', password: 'Pass123' })

    const response = await adminRegister(
      { name: 'Admin 2', email: 'admin2@test.local', password: 'Pass123' },
      { noAuth: true } // No authorization header
    )

    expect(response.status).toBe(403)
  })
})
```

### 4. Rate Limiting - Brute Force Protection

**Why Critical**: Prevents credential stuffing

**Test**: Make 6 rapid login attempts, 6th should fail

```javascript
describe('Rate Limiting - Auth Endpoints', () => {
  it('should block after max attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await login({ email: 'test@test.com', password: 'wrong' })
    }

    const response = await login({ email: 'test@test.com', password: 'wrong' })
    expect(response.status).toBe(429) // Too Many Requests
  })
})
```

### 5. Input Validation - SQL Injection Prevention

**Why Critical**: Prevents database attacks

**Test**: Verify SQL injection attempts are blocked

```javascript
describe('Input Validation - SQL Injection', () => {
  it('should reject SQL injection in city search', async () => {
    const maliciousCityInput = "'; DROP TABLE flights; --"

    const response = await searchHotels({
      city: maliciousCityInput,
      checkIn: '2024-06-15'
    })

    // Prisma should sanitize the input
    expect(response.status).toBe(400)
  })
})
```

---

## Testing Stack Setup

### Backend Testing

```bash
cd makemytrip-backend

# Install testing dependencies
npm install --save-dev jest supertest @testing-library/jest-dom
npm install --save-dev dotenv-cli

# Create jest config
npm init -y
```

**jest.config.js**:
```javascript
module.exports = {
  testEnvironment: 'node',
  coveragePathIgnorePatterns: ['/node_modules/'],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
}
```

**jest.setup.js**:
```javascript
require('dotenv').config({ path: '.env.test' })
```

### Frontend Testing

```bash
cd makemytrip-frontend

# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest
npm install --save-dev jsdom @vitest/ui

# Create vitest config in vite.config.js
```

---

## Test File Structure

### Backend Example

```javascript
// __tests__/bookings/raceCondition.test.js

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import prisma from '../../src/config/prismaClient'
import { createFlightBooking, getFlight } from '../../src/controllers/bookingController'

describe('Booking Race Condition', () => {
  let testFlight

  beforeEach(async () => {
    testFlight = await prisma.flight.create({
      data: { airline: 'Test', flightNumber: 'T001', seatsAvailable: 20 }
    })
  })

  afterEach(async () => {
    await prisma.flight.delete({ where: { id: testFlight.id } })
  })

  it('should prevent overbooking', async () => {
    // Test implementation
  })
})
```

### Frontend Example

```javascript
// __tests__/components/FlightCard.test.jsx

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import FlightCard from '../../src/components/SearchResults/FlightCard'

describe('FlightCard Component', () => {
  it('should render flight details', () => {
    const flight = {
      id: '1',
      airline: 'IndiGo',
      price: 5000,
      duration: '2h 30m'
    }

    render(<FlightCard flight={flight} />)
    expect(screen.getByText('IndiGo')).toBeInTheDocument()
    expect(screen.getByText('₹5,000')).toBeInTheDocument()
  })
})
```

---

## Running Tests

```bash
# Backend
cd makemytrip-backend
npm test                    # Run all tests
npm test -- --coverage      # Generate coverage report
npm test -- bookings.test   # Run specific test file
npm test -- --watch         # Watch mode (re-run on change)

# Frontend
cd makemytrip-frontend
npm test                    # Run all tests
npm test -- --ui           # Open test UI
npm test -- --coverage     # Generate coverage report
```

---

## Test Coverage Goals

| Category | Target | Current |
|----------|--------|---------|
| Critical Flows | 95% | 0% |
| Utility Functions | 90% | 0% |
| Components | 80% | 0% |
| Controllers | 85% | 0% |
| **Overall** | **90%** | **0%** |

---

## Manual Testing Checklist

Before committing, verify manually:

### User Flow
- [ ] Register new user
- [ ] Login with registered user
- [ ] Search flights
- [ ] Select flight
- [ ] Fill passenger details
- [ ] Review booking
- [ ] Complete payment
- [ ] Receive confirmation email
- [ ] View booking in "My Trips"
- [ ] Cancel booking
- [ ] Verify refund

### Admin Flow
- [ ] Login as admin
- [ ] Create new flight
- [ ] Edit flight details
- [ ] Delete flight
- [ ] View bookings
- [ ] View user list

### Error Cases
- [ ] Invalid login (wrong password)
- [ ] Duplicate email registration
- [ ] Search with missing fields
- [ ] Booking with no seats available
- [ ] Cancel already cancelled booking

---

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_DB: makemytrip_test
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s

    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Backend Tests
        run: |
          cd makemytrip-backend
          npm install
          npm test

      - name: Frontend Tests
        run: |
          cd makemytrip-frontend
          npm install
          npm test

      - name: Upload Coverage
        uses: codecov/codecov-action@v2
```

---

## Performance Testing

### Load Testing Script

```bash
# Using Apache Bench
ab -n 1000 -c 100 https://api.yourdomain.com/api/v1/flights/search?from=DEL&to=BOM

# Using k6
k6 run load-test.js
```

### Benchmark Critical Operations

```javascript
console.time('Flight Search')
const results = await searchFlights({ from: 'DEL', to: 'BOM' })
console.timeEnd('Flight Search')
// Target: < 500ms
```

---

## Test Data Fixtures

Create reusable test data:

```javascript
// __tests__/fixtures/flights.js
export const mockFlight = {
  id: 'flight-1',
  airline: 'IndiGo',
  flightNumber: '6E-234',
  price: 5000,
  seatsAvailable: 100,
  departureTime: '10:00',
  arrivalTime: '13:00'
}

export const createTestFlight = async (overrides = {}) => {
  return prisma.flight.create({
    data: { ...mockFlight, ...overrides }
  })
}
```

---

## Debugging Tests

```bash
# Run with verbose output
npm test -- --reporter=verbose

# Debug single test
node --inspect-brk node_modules/.bin/jest __tests__/specific.test.js

# Chrome DevTools debugging
chrome://inspect
```

---

## Next Steps

1. **This Week**: Write critical tests (race condition, refund, security)
2. **Next Week**: Achieve 50% coverage
3. **Month**: Target 90% coverage
4. **Ongoing**: Add tests for new features before merging

---

**Testing is not optional. It's what separates production-ready from production-fragile.**

For questions, see Jest docs: https://jestjs.io/docs/getting-started
