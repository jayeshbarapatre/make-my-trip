// Loaded before any src/ import: firebase.js reads its credentials at module
// scope, so without this the suite dies on import rather than on assertion.
import 'dotenv/config'

import { test, describe, after } from 'node:test'
import assert from 'node:assert/strict'
import { requireFirestore } from './firestoreGuard.mjs'
import bcrypt from 'bcryptjs'
import { now } from '../src/utils/time.js'

import { db } from '../src/config/firebase.js'
import * as otpService from '../src/services/otpService.js'
import { normalizeEmail, findUserByEmail } from '../src/utils/identity.js'
import { firebaseLogin, firebaseVerifyOtp } from '../src/controllers/firebaseAuthController.js'
import { cancelBooking } from '../src/controllers/firebaseBookingController.js'
import { describePasswordWeakness } from '../src/utils/validation.js'
import { AccountStatus, Role } from '../src/config/roles.js'

// Firestore-backed suites fail fast instead of hanging on SDK retries when the
// datastore is unreachable (quota exhausted, network down).
const firestoreGate = await requireFirestore()

// Each test here pins a defect that was live in this codebase and confirmed by
// reproduction. They are written as "the broken behaviour must not come back",
// so a regression reads as a failing test rather than a subtle behaviour change.
//
// These drive the real controllers against the real Firestore project, because
// every defect below lived in the seam between a controller, a service and the
// datastore — a mocked store would not have caught any of them. Every document
// they create is prefixed `regtest_` and removed in `after`.

const TAG = 'regtest'
const PASSWORD = 'testpass1'
const created = { users: [], flights: [], bookings: [], otps: [] }

const mockRes = () => {
  const r = { statusCode: 200 }
  r.status = (c) => { r.statusCode = c; return r }
  r.json = (b) => { r.body = b; return r }
  return r
}

const invoke = (handler, req) => new Promise((resolve) => {
  const res = { statusCode: 200 }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { resolve({ status: res.statusCode, body: b }) ; return res }
  handler(req, res)
})

const makeUser = async (email, accountStatus = AccountStatus.ACTIVE) => {
  const doc = {
    id: `${TAG}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    name: 'Regression Test',
    phone: '+919876500000',
    phoneE164: '+919876500000',
    password: await bcrypt.hash(PASSWORD, 10),
    role: Role.CUSTOMER,
    accountStatus,
    isDeleted: false,
    createdAt: now()
  }
  await db.collection('users').doc(email).set(doc)
  created.users.push(email)
  return doc
}

const testEmail = (label) =>
  `${TAG}_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@integration.test`

after(async () => {
  // Logging in now opens a session document. This cleanup predates sessions,
  // so without this sweep every login in this suite leaked one.
  for (const email of created.users) {
    const sessions = await db.collection('sessions').where('userEmail', '==', email).get().catch(() => ({ docs: [] }))
    for (const d of sessions.docs) await d.ref.delete().catch(() => {})
  }

  for (const id of created.users) await db.collection('users').doc(id).delete().catch(() => {})
  for (const id of created.flights) await db.collection('flights').doc(id).delete().catch(() => {})
  for (const id of created.bookings) {
    await db.collection('bookings').doc(id).delete().catch(() => {})
    const refunds = await db.collection('refunds').where('bookingId', '==', id).get().catch(() => ({ docs: [] }))
    for (const d of refunds.docs) await d.ref.delete().catch(() => {})
  }
  for (const o of created.otps) await otpService.clearOtp(o).catch(() => {})
})

describe('email identity is case-insensitive', firestoreGate, () => {
  // Firestore compares document ids byte-for-byte. Registration and all three
  // login paths keyed on the raw request value while otpService lowercased
  // every identifier, so a capitalised signup could never receive an email OTP
  // or reset its password, and could register a second separate account.

  test('normalizeEmail folds case and trims', () => {
    assert.equal(normalizeEmail('  JoHn@Ex.COM '), 'john@ex.com')
    assert.equal(normalizeEmail(null), '')
    assert.equal(normalizeEmail(42), '')
  })

  test('one account resolves from any casing', async () => {
    const email = testEmail('case')
    const user = await makeUser(email)

    for (const variant of [email, email.toUpperCase(), `  ${email.toUpperCase()}  `]) {
      const found = await findUserByEmail(db, variant)
      assert.ok(found, `no account found for ${variant}`)
      assert.equal(found.data.id, user.id)
    }
  })

  test('login accepts an uppercased address', async () => {
    const email = testEmail('logincase')
    await makeUser(email)

    const res = await invoke(firebaseLogin, { body: { email: email.toUpperCase(), password: PASSWORD } })
    assert.equal(res.status, 200)
    assert.ok(res.body?.data?.token, 'expected a token')
  })

  test('no stored user document has a mixed-case id', async () => {
    const snap = await db.collection('users').get()
    const offenders = snap.docs.filter((d) => d.id !== d.id.toLowerCase()).map((d) => d.id)
    assert.deepEqual(offenders, [], 'these documents are unreachable by canonical lookup')
  })
})

describe('account status is enforced at login', firestoreGate, () => {
  // Login ignored accountStatus entirely, so a suspended account still received
  // a 7-day token. Any route guarded by `authenticate` alone accepted it.

  test('an active account receives a token', async () => {
    const email = testEmail('active')
    await makeUser(email, AccountStatus.ACTIVE)

    const res = await invoke(firebaseLogin, { body: { email, password: PASSWORD } })
    assert.equal(res.status, 200)
    assert.ok(res.body?.data?.token)
  })

  test('a suspended account is refused and gets no token', async () => {
    const email = testEmail('susp')
    await makeUser(email, AccountStatus.SUSPENDED)

    const res = await invoke(firebaseLogin, { body: { email, password: PASSWORD } })
    assert.equal(res.status, 403)
    assert.equal(res.body?.code, 'ACCOUNT_NOT_ACTIVE')
    assert.ok(!res.body?.data?.token, 'a suspended account must not be issued a token')
  })

  test('status is checked after the password, not before', async () => {
    // Otherwise the endpoint reveals which addresses are suspended to someone
    // who does not know the credential.
    const email = testEmail('susporder')
    await makeUser(email, AccountStatus.SUSPENDED)

    const res = await invoke(firebaseLogin, { body: { email, password: 'wrongpass1' } })
    assert.equal(res.status, 401)
  })
})

describe('password-reset pre-check verifies the code', firestoreGate, () => {
  // The pre-check read the OTP document directly and asserted only that it
  // existed and had not expired — it never compared the submitted code, so any
  // value at all was answered with "Code accepted".

  test('a wrong code is rejected', async () => {
    const email = testEmail('reset')
    const ident = { identifier: email, channel: 'email', purpose: 'password_reset' }
    await otpService.issueOtp(ident)
    created.otps.push(ident)

    const res = await invoke(firebaseVerifyOtp, {
      body: { email, otp: '000000', purpose: 'password_reset' }
    })
    assert.equal(res.status, 400)
    assert.equal(res.body?.code, 'OTP_INVALID')
  })

  test('the correct code is accepted but not consumed', async () => {
    const email = testEmail('reset2')
    const ident = { identifier: email, channel: 'email', purpose: 'password_reset' }
    const { otp } = await otpService.issueOtp(ident)
    created.otps.push(ident)

    const res = await invoke(firebaseVerifyOtp, { body: { email, otp, purpose: 'password_reset' } })
    assert.equal(res.status, 200)

    // The two-step UI validates on one screen and resets on the next, so the
    // code has to survive the pre-check.
    const authoritative = await otpService.verifyOtp({ ...ident, otp })
    assert.equal(authoritative.ok, true, 'pre-check must not consume the code')

    // ...but the authoritative check does consume it.
    const replay = await otpService.verifyOtp({ ...ident, otp })
    assert.equal(replay.ok, false, 'a consumed code must not be replayable')
  })

  test('a wrong code spends an attempt from the budget', async () => {
    // Otherwise the non-consuming path is an unlimited guessing oracle.
    const email = testEmail('reset3')
    const ident = { identifier: email, channel: 'email', purpose: 'password_reset' }
    await otpService.issueOtp(ident)
    created.otps.push(ident)

    const first = await otpService.verifyOtp({ ...ident, otp: '111111', consume: false })
    const second = await otpService.verifyOtp({ ...ident, otp: '111111', consume: false })

    assert.equal(first.ok, false)
    assert.equal(second.ok, false)
    assert.ok(second.attemptsRemaining < first.attemptsRemaining, 'attempts must decrease')
  })
})

describe('cancellation releases inventory exactly once', firestoreGate, () => {
  // Read-check-update split across separate calls let concurrent cancellations
  // all observe status !== 'cancelled', all write the cancellation, and all
  // release the same seats — inventing inventory that was never sold back.
  // Reproduced at 8 concurrent calls: a 3-seat booking returned 24 seats.

  test('eight concurrent cancels release one booking worth of seats', async () => {
    const flightId = `${TAG}_flight_${Date.now()}`
    const bookingId = `${TAG}_booking_${Date.now()}`
    const userId = `${TAG}_user`
    const total = 100
    const booked = 3

    await db.collection('flights').doc(flightId).set({
      from: 'TestA', to: 'TestB', price: 1000, seatsAvailable: total - booked, isActive: false
    })
    created.flights.push(flightId)

    await db.collection('bookings').doc(bookingId).set({
      bookingId, userId, type: 'flight', flightId, seatCount: booked,
      status: 'confirmed', totalAmount: 3000, createdAt: now()
    })
    created.bookings.push(bookingId)

    const results = await Promise.all(Array.from({ length: 8 }, () => {
      const res = mockRes()
      return cancelBooking(
        { userId, user: { id: userId }, params: { id: bookingId }, body: {} },
        res
      ).then(() => res.statusCode)
    }))

    assert.equal(results.filter((s) => s === 200).length, 1, 'exactly one cancel should win')
    assert.equal(results.filter((s) => s === 400).length, 7, 'the rest are already-cancelled')

    const seats = (await db.collection('flights').doc(flightId).get()).data().seatsAvailable
    assert.equal(seats, total, `expected ${total} seats, found ${seats} (phantom inventory)`)
  })

  test('a booking cannot be cancelled by another user', async () => {
    const bookingId = `${TAG}_owner_${Date.now()}`
    await db.collection('bookings').doc(bookingId).set({
      bookingId, userId: `${TAG}_owner`, type: 'flight', status: 'confirmed', totalAmount: 100
    })
    created.bookings.push(bookingId)

    const res = mockRes()
    await cancelBooking(
      { userId: `${TAG}_attacker`, user: { id: `${TAG}_attacker` }, params: { id: bookingId }, body: {} },
      res
    )
    assert.equal(res.statusCode, 403)

    const after = (await db.collection('bookings').doc(bookingId).get()).data()
    assert.equal(after.status, 'confirmed', 'the booking must be untouched')
  })
})

describe('one password policy is in force', () => {
  // The customer auth controller carried a local `validatePassword` that
  // checked length only, while the admin and vendor paths used the shared
  // policy. Two definitions means the weaker one is the real one.

  test('the shared policy requires a digit and a lowercase letter', () => {
    assert.ok(describePasswordWeakness('abcdefgh'), 'no digit should be rejected')
    assert.ok(describePasswordWeakness('12345678'), 'no letter should be rejected')
    assert.ok(describePasswordWeakness('ab1'), 'too short should be rejected')
    assert.equal(describePasswordWeakness('goodpass1'), null)
  })

  test('privileged accounts get a stricter bar', () => {
    assert.equal(describePasswordWeakness('goodpass1', { strict: false }), null)
    assert.ok(describePasswordWeakness('goodpass1', { strict: true }), 'admins need more')
  })
})

describe('internal errors are not disclosed to clients', () => {
  test('auth handlers never return a raw exception message', async () => {
    // `Registration failed: ${err.message}` leaked Firestore paths, field names
    // and index hints to anyone who could trigger a 500.
    const { readFile } = await import('node:fs/promises')
    const source = await readFile(new URL('../src/controllers/firebaseAuthController.js', import.meta.url), 'utf8')

    const leaks = source
      .split('\n')
      .map((line, i) => ({ line: line.trim(), n: i + 1 }))
      .filter(({ line }) => /res\.status\(5\d\d\)/.test(line) && /err\.message|error\.message/.test(line))

    assert.deepEqual(leaks, [], 'a 5xx response must not carry err.message')
  })
})
