// Datastore failures must not be reported as the caller's mistake.
//
// A day was lost to a login screen that said "Login failed" while the real
// cause was an exhausted Firestore read quota. Login is a read, so when the
// quota went the lookup threw and every controller's catch-all blamed the
// password. The admin, the vendor and the customer all saw the same confidently
// wrong message pointing at the one thing that was fine.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

import {
  isDatastoreUnavailable,
  isQuotaExhausted,
  respondIfDatastoreDown
} from '../src/utils/datastoreErrors.js'

/** The shape Firestore actually throws when the free-tier quota is gone. */
const quotaError = () => Object.assign(new Error('8 RESOURCE_EXHAUSTED: Quota exceeded.'), {
  code: 8,
  details: 'Quota exceeded.'
})

const fakeRes = () => ({
  statusCode: null,
  body: null,
  status (c) { this.statusCode = c; return this },
  json (b) { this.body = b; return this }
})

describe('recognising a datastore failure', () => {
  test('the real Firestore quota error is recognised', () => {
    assert.equal(isDatastoreUnavailable(quotaError()), true)
    assert.equal(isQuotaExhausted(quotaError()), true)
  })

  test('a transient outage is recognised but is not a quota problem', () => {
    const err = Object.assign(new Error('14 UNAVAILABLE: no connection'), { code: 14 })
    assert.equal(isDatastoreUnavailable(err), true)
    assert.equal(isQuotaExhausted(err), false, 'a retry fixes this one; a plan change does not')
  })

  test('an ordinary application error is left alone', () => {
    for (const err of [new Error('Invalid password'), new Error('Booking not found'), null, undefined]) {
      assert.equal(isDatastoreUnavailable(err), false)
    }
  })

  test('a wrong-password error is never mistaken for an outage', () => {
    // The inverse of the bug: an auth failure must still read as an auth failure.
    assert.equal(isDatastoreUnavailable(new Error('Incorrect email or password')), false)
  })
})

describe('what the caller is told', () => {
  test('a quota failure answers 503, not 500', () => {
    const res = fakeRes()
    const handled = respondIfDatastoreDown(res, quotaError(), 'Admin sign-in')

    assert.equal(handled, true)
    assert.equal(res.statusCode, 503, '503 means "come back later", 500 means "you broke it"')
    assert.equal(res.body.code, 'DATASTORE_QUOTA_EXCEEDED')
  })

  test('the message clears the customer of blame and says what to do', () => {
    const res = fakeRes()
    respondIfDatastoreDown(res, quotaError(), 'Admin sign-in')

    assert.match(res.body.message, /not a problem with your details/i)
    assert.match(res.body.message, /resets|upgrade/i)
    assert.doesNotMatch(res.body.message, /login failed/i)
  })

  test('an ordinary error is not handled, so the controller keeps its own message', () => {
    const res = fakeRes()
    const handled = respondIfDatastoreDown(res, new Error('Invalid password'), 'Admin sign-in')

    assert.equal(handled, false)
    assert.equal(res.statusCode, null, 'nothing may be sent, or the controller would double-respond')
  })
})
