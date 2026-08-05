import { test, describe, before } from 'node:test'
import assert from 'node:assert/strict'
import { get, post, request, registerCustomer, testEmail, BASE_URL } from './helpers.mjs'

// Each test here pins a vulnerability that was live in this codebase and was
// confirmed by exploit. They are written as "the attack must fail", so a
// regression reads as a failing security test rather than a subtle behaviour change.

describe('authentication', () => {
  let customer

  before(async () => {
    customer = await registerCustomer()
  })

  test('rejects a request with no token', async () => {
    const { status } = await post('/bookings/flights', { type: 'flight' })
    assert.equal(status, 401)
  })

  test('rejects a tampered token', async () => {
    const { status } = await post('/bookings/flights', { type: 'flight' }, {
      token: customer.token.slice(0, -4) + 'AAAA'
    })
    assert.equal(status, 401)
  })

  test('accepts a valid token on a protected route', async () => {
    const { status, body } = await get('/auth/profile', { token: customer.token })
    assert.equal(status, 200)
    assert.ok(JSON.stringify(body).includes('@'), 'profile should carry the account email')
  })
})

describe('privilege escalation — admin creation', () => {
  test('anonymous callers cannot create an admin', async () => {
    // This endpoint was unauthenticated: anyone could POST here and receive a
    // working admin token, i.e. full read/write over every user and booking.
    const { status } = await post('/admin/register', {
      name: 'Escalation Attempt',
      email: testEmail(),
      password: 'StrongPass123!x'
    })
    assert.equal(status, 401, 'admin creation must require authentication')
  })

  test('a customer token cannot create an admin', async () => {
    const customer = await registerCustomer()
    const { status } = await post('/admin/register', {
      name: 'Escalation Attempt',
      email: testEmail(),
      password: 'StrongPass123!x'
    }, { token: customer.token })

    assert.equal(status, 403, 'only a super admin may create administrators')
  })

  test('a customer token cannot read the admin user list', async () => {
    const customer = await registerCustomer()
    const { status } = await get('/admin/users', { token: customer.token })
    assert.equal(status, 403)
  })
})

describe('booking integrity', () => {
  let customer

  before(async () => {
    customer = await registerCustomer()
  })

  test('cannot create a booking without a verified payment', async () => {
    // Previously produced a confirmed booking with paymentStatus "completed".
    const { status, body } = await post('/bookings/flights', {
      type: 'flight',
      totalAmount: 1,
      paymentStatus: 'completed',
      from: 'DEL',
      to: 'BOM'
    }, { token: customer.token })

    assert.equal(status, 402)
    assert.equal(body.code, 'PAYMENT_REQUIRED')
  })

  test('cannot assign a booking to another user', async () => {
    // The request body used to be spread over the document after the server
    // fields, so userId/bookingId/isDeleted were all client-controlled.
    const { status, body } = await post('/bookings/flights', {
      type: 'flight',
      totalAmount: 1,
      userId: 'VICTIM_USER_ID',
      bookingId: 'FORGED-ID',
      isDeleted: true
    }, { token: customer.token })

    assert.equal(status, 402)
    assert.equal(body.code, 'PAYMENT_REQUIRED')
  })

  test('cannot create a booking with a negative amount', async () => {
    const { status } = await post('/bookings/flights', {
      type: 'flight',
      totalAmount: -50000
    }, { token: customer.token })

    assert.equal(status, 402)
  })

  test('rejects an unsupported booking type', async () => {
    const { status } = await post('/bookings/flights', {
      type: 'spaceship',
      totalAmount: 100
    }, { token: customer.token })

    assert.equal(status, 400)
  })

  test('a user only ever sees their own bookings', async () => {
    // The route takes a userId path parameter. `canReadOwn` denies outright when
    // it names anyone but the authenticated principal — stricter than silently
    // re-scoping the query, and it does not pretend the request was honoured.
    const other = await get('/bookings/user/SOMEONE_ELSE', { token: customer.token })
    assert.equal(other.status, 403, 'asking for another user\'s bookings must be refused')

    // The caller's own id still works, and returns only their bookings.
    const own = await get(`/bookings/user/${customer.id}`, { token: customer.token })
    assert.equal(own.status, 200)
    for (const b of own.body?.data ?? []) {
      assert.equal(b.userId, customer.id, 'no other user\'s booking may be returned')
    }
  })
})

describe('transport hardening', () => {
  test('sets defensive response headers', async () => {
    const res = await fetch(`${BASE_URL}/health`)
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(res.headers.get('x-frame-options'), 'DENY')
    assert.ok(res.headers.get('referrer-policy'))
  })

  test('rejects an oversized request body', async () => {
    const customer = await registerCustomer()
    const { status } = await request('POST', '/bookings/flights', {
      token: customer.token,
      raw: JSON.stringify({ type: 'flight', pad: 'x'.repeat(400_000) })
    })
    assert.equal(status, 413)
  })

  test('rejects malformed JSON with 400, not a stack trace', async () => {
    const customer = await registerCustomer()
    const { status, body } = await request('POST', '/bookings/flights', {
      token: customer.token,
      raw: '{"type": "flight",,,}'
    })

    assert.equal(status, 400)
    assert.ok(
      !JSON.stringify(body).includes('at Object.'),
      'error responses must not leak stack traces'
    )
  })

  test('refuses a cross-origin request from an unlisted origin', async () => {
    // Any *.vercel.app host used to be trusted with credentials enabled.
    const res = await fetch(`${API_FLIGHTS}`, { headers: { Origin: 'https://attacker.vercel.app' } })
    assert.ok(res.status >= 400, `expected a rejection, got ${res.status}`)
  })
})

const API_FLIGHTS = `${BASE_URL}/api/v1/flights`
