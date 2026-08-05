// Production error capture (launch gate 4).
//
// Before this, an unhandled error reached console.error and nothing else. On a
// hosted deployment that means it scrolls past in a log stream nobody watches,
// so the first report of an outage is a customer email.
//
// Two things decide whether this is safe to run in production: it must never
// store a secret or a customer's PII (a crash report is still a log), and it
// must not be able to burn the Firestore daily quota, which this project has
// exhausted once already.

import 'dotenv/config'

import { test, describe, mock, before, beforeEach } from 'node:test'
import assert from 'node:assert/strict'

import { newDb } from './fakeFirestore.mjs'

const db = newDb()

mock.module('../src/config/firebase.js', { namedExports: { db } })
mock.module('firebase-admin/firestore', {
  namedExports: {
    Timestamp: class { static now () { return new Date() } },
    FieldValue: {
      serverTimestamp: () => new Date(),
      // The fake store has no increment sentinel; a plain number is enough to
      // assert that the same fingerprint converges on one document.
      increment: (n) => n
    }
  }
})

const { reportError, fingerprintOf, redact, resetThrottle } =
  await import('../src/services/errorReporter.js')

const reset = () => {
  db.records.clear()
  db.versions.clear()
  resetThrottle()
}

before(() => {
  mock.method(console, 'error', () => {})
  mock.method(console, 'warn', () => {})
})

describe('a crash report is not a place to leak secrets', () => {
  beforeEach(reset)

  test('tokens, emails, phones and card numbers are stripped', () => {
    const dirty = [
      'auth failed for eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTYifQ.abcdefghijk',
      'user traveller@example.com could not be charged',
      'card 4111 1111 1111 1111 declined',
      'sms to +919876543210 failed',
      'gateway key rzp_live_AbCdEf123456 rejected'
    ].join(' | ')

    const clean = redact(dirty)

    assert.match(clean, /\[jwt\]/)
    assert.match(clean, /\[email\]/)
    assert.match(clean, /\[card\]/)
    assert.match(clean, /\[phone\]/)
    assert.match(clean, /\[key\]/)

    for (const secret of ['eyJhbGciOiJIUzI1NiJ9', 'traveller@example.com',
      '4111 1111 1111 1111', '9876543210', 'rzp_live_AbCdEf123456']) {
      assert.ok(!clean.includes(secret), `${secret} survived redaction`)
    }
  })

  test('what is stored is redacted, not just what is returned', async () => {
    await reportError({
      error: new Error('charge failed for traveller@example.com'),
      context: { method: 'POST', path: '/api/v1/payment/verify' }
    })

    const stored = [...db.records.values()].map((r) => JSON.stringify(r.data)).join('')
    assert.ok(!stored.includes('traveller@example.com'), 'a customer email reached the datastore')
    assert.ok(stored.includes('[email]'))
  })

  test('the request body is never stored', async () => {
    await reportError({
      error: new Error('boom'),
      context: {
        method: 'POST',
        path: '/api/v1/auth/login',
        body: { password: 'hunter2', token: 'secret-token' }
      }
    })

    const stored = [...db.records.values()].map((r) => JSON.stringify(r.data)).join('')
    assert.ok(!stored.includes('hunter2'), 'a password reached the datastore')
    assert.ok(!stored.includes('secret-token'))
  })
})

describe('one broken thing is one document, not thousands', () => {
  beforeEach(reset)

  test('the same failure with different ids shares a fingerprint', () => {
    const a = fingerprintOf({ source: 'server', message: 'Booking BK12345678 not found', stack: '' })
    const b = fingerprintOf({ source: 'server', message: 'Booking BK99999999 not found', stack: '' })
    assert.equal(a, b, 'ids must normalise out or every occurrence is a new problem')
  })

  test('genuinely different failures do not collide', () => {
    const a = fingerprintOf({ source: 'server', message: 'Booking not found', stack: '' })
    const b = fingerprintOf({ source: 'server', message: 'Payment gateway timeout', stack: '' })
    assert.notEqual(a, b)
  })

  test('a hot loop writes once, not once per iteration', async () => {
    const err = new Error('the same thing failing over and over')

    const results = []
    for (let i = 0; i < 50; i++) {
      results.push(await reportError({ error: err, context: { path: '/api/v1/search' } }))
    }

    const written = results.filter((r) => r.recorded).length
    assert.equal(written, 1, 'the throttle must collapse a repeated error to one write')
    assert.equal(db.records.size, 1, 'and to one document')
    assert.equal(results.filter((r) => r.reason === 'throttled').length, 49)
  })

  test('distinct failures are each recorded', async () => {
    await reportError({ error: new Error('first problem') })
    await reportError({ error: new Error('second, unrelated problem') })
    assert.equal(db.records.size, 2)
  })
})

describe('the reporter cannot make things worse', () => {
  beforeEach(reset)

  test('a datastore failure does not throw back into the request', async () => {
    const broken = { collection: () => { throw new Error('Firestore is down') } }
    mock.method(db, 'collection', broken.collection)

    const result = await reportError({ error: new Error('original failure') })

    assert.equal(result.recorded, false)
    assert.equal(result.reason, 'reporter_failed')
    mock.restoreAll()
  })

  test('a non-Error value is still recorded', async () => {
    const result = await reportError({ error: 'just a string' })
    assert.equal(result.recorded, true)
  })
})
