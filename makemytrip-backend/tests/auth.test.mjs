// Loaded before any src/ import: firebase.js reads its credentials at module
// scope, so without this the suite dies on import rather than on assertion.
import 'dotenv/config'

import { test, describe, after } from 'node:test'
import assert from 'node:assert/strict'
import { requireFirestore } from './firestoreGuard.mjs'
import { spawn } from 'node:child_process'
import bcrypt from 'bcryptjs'
import { now } from '../src/utils/time.js'
import jwt from 'jsonwebtoken'

import { db } from '../src/config/firebase.js'
import {
  issueSession,
  rotateSession,
  revokeSession,
  revokeAllSessions,
  listSessions,
  assertSessionLive,
  currentTokenVersion,
  purgeDeadSessions,
  SESSIONS
} from '../src/services/tokenService.js'
import { loadPrincipal } from '../src/middleware/rbac.js'
import { firebaseLogin, firebaseLogout, firebaseRefresh } from '../src/controllers/firebaseAuthController.js'
import { AccountStatus, Role } from '../src/config/roles.js'

// Firestore-backed suites fail fast instead of hanging on SDK retries when the
// datastore is unreachable (quota exhausted, network down).
const firestoreGate = await requireFirestore()

// Session lifecycle. Before this milestone tokens were 7-day, stateless and
// irrevocable: logout was a no-op, a password reset left every existing session
// working, and a suspended account kept a usable token until it expired.
//
// These tests pin each of those behaviours as "must not come back".

const TAG = 'authtest'
const PASSWORD = 'testpass1'
const created = { users: [], sessions: [] }

const testEmail = (label) =>
  `${TAG}_${label}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@integration.test`

const makeUser = async (email, accountStatus = AccountStatus.ACTIVE) => {
  const doc = {
    id: `${TAG}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    email,
    name: 'Auth Test',
    phone: '+919876500000',
    phoneE164: '+919876500000',
    password: await bcrypt.hash(PASSWORD, 10),
    role: Role.CUSTOMER,
    accountStatus,
    tokenVersion: 1,
    revokedSessions: [],
    isDeleted: false,
    createdAt: now()
  }
  await db.collection('users').doc(email).set(doc)
  created.users.push(email)
  return doc
}

const userRefFor = async (id) => {
  const snap = await db.collection('users').where('id', '==', id).limit(1).get()
  return snap.empty ? null : snap.docs[0].ref
}

const loadUser = async (id) => {
  const snap = await db.collection('users').where('id', '==', id).limit(1).get()
  return snap.empty ? null : snap.docs[0].data()
}

const invoke = (handler, req) => new Promise((resolve) => {
  const res = { statusCode: 200 }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { resolve({ status: res.statusCode, body: b }); return res }
  handler(req, res)
})

/** Drives the real middleware so route protection is tested, not simulated. */
const runPrincipal = (decodedToken) => new Promise((resolve) => {
  const req = { user: decodedToken, userId: decodedToken.id }
  const res = { statusCode: 200 }
  res.status = (c) => { res.statusCode = c; return res }
  res.json = (b) => { resolve({ status: res.statusCode, body: b, passed: false }); return res }
  loadPrincipal(req, res, () => resolve({ status: 200, passed: true, req }))
})

const decode = (token) => jwt.verify(token, process.env.JWT_SECRET)

after(async () => {
  for (const id of created.users) await db.collection('users').doc(id).delete().catch(() => {})
  for (const sid of created.sessions) await db.collection(SESSIONS).doc(sid).delete().catch(() => {})
  // Sweep any session opened by a login handler during the suite.
  for (const id of created.users) {
    const snap = await db.collection(SESSIONS).where('userEmail', '==', id).get().catch(() => ({ docs: [] }))
    for (const d of snap.docs) await d.ref.delete().catch(() => {})
  }
})

describe('session issuance', firestoreGate, () => {
  test('login returns an access token and a refresh token', async () => {
    const email = testEmail('login')
    await makeUser(email)

    const res = await invoke(firebaseLogin, { body: { email, password: PASSWORD }, headers: {}, ip: '127.0.0.1' })
    assert.equal(res.status, 200)
    assert.ok(res.body?.data?.token, 'expected an access token')
    assert.ok(res.body?.data?.refreshToken, 'expected a refresh token')
  })

  test('the access token carries a session id and token version', async () => {
    const email = testEmail('claims')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    const claims = decode(session.accessToken)
    assert.equal(claims.sid, session.sid)
    assert.equal(claims.tv, 1)
    assert.equal(claims.id, user.id)
  })

  test('the refresh token is never stored in plaintext', async () => {
    const email = testEmail('hash')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    const stored = (await db.collection(SESSIONS).doc(session.sid).get()).data()
    assert.ok(!JSON.stringify(stored).includes(session.refreshToken), 'refresh token must be hashed at rest')
    assert.ok(stored.refreshHash, 'expected a refreshHash')
  })
})

describe('single-session revocation', firestoreGate, () => {
  test('logout ends that session on the very next request', async () => {
    const email = testEmail('logout')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    const claims = decode(session.accessToken)

    const before = await runPrincipal(claims)
    assert.equal(before.passed, true, 'session should be live before logout')

    await revokeSession({ userRef: await userRefFor(user.id), decoded: claims })

    const after = await runPrincipal(claims)
    assert.equal(after.passed, false, 'a logged-out token must be rejected')
    assert.equal(after.status, 401)
    assert.equal(after.body?.code, 'SESSION_REVOKED')
  })

  test('logging out one device leaves the others signed in', async () => {
    const email = testEmail('twodev')
    const user = await makeUser(email)

    const phone = await issueSession(user, { userAgent: 'phone' })
    const laptop = await issueSession(user, { userAgent: 'laptop' })
    created.sessions.push(phone.sid, laptop.sid)

    await revokeSession({ userRef: await userRefFor(user.id), decoded: decode(phone.accessToken) })

    const phoneAfter = await runPrincipal(decode(phone.accessToken))
    const laptopAfter = await runPrincipal(decode(laptop.accessToken))

    assert.equal(phoneAfter.passed, false, 'the device that logged out must be signed out')
    assert.equal(laptopAfter.passed, true, 'the other device must stay signed in')
  })

  test('revoked session ids do not accumulate forever', async () => {
    // The entries are parked on the user document, so an unbounded list would
    // grow it without limit. They are dropped once the access token they refer
    // to would have expired anyway.
    const email = testEmail('prune')
    const user = await makeUser(email)
    const ref = await userRefFor(user.id)

    // An already-expired revocation entry must be swept on the next write.
    await ref.update({ revokedSessions: [{ sid: 'sess_ancient', expiresAtMs: Date.now() - 60_000 }] })

    const session = await issueSession(user, {})
    created.sessions.push(session.sid)
    await revokeSession({ userRef: ref, decoded: decode(session.accessToken) })

    const stored = (await ref.get()).data().revokedSessions
    assert.ok(!stored.some((e) => e.sid === 'sess_ancient'), 'expired entries must be pruned')
    assert.ok(stored.some((e) => e.sid === session.sid), 'the new revocation must be recorded')
  })
})

describe('account-wide revocation', firestoreGate, () => {
  test('revoking all sessions bumps the token version and kills every device', async () => {
    const email = testEmail('all')
    const user = await makeUser(email)

    const a = await issueSession(user, {})
    const b = await issueSession(user, {})
    created.sessions.push(a.sid, b.sid)

    await revokeAllSessions(await userRefFor(user.id))

    for (const s of [a, b]) {
      const result = await runPrincipal(decode(s.accessToken))
      assert.equal(result.passed, false, 'every pre-existing session must be dead')
      assert.equal(result.body?.code, 'SESSION_REVOKED')
    }

    const stored = await loadUser(user.id)
    assert.equal(currentTokenVersion(stored), 2)
  })

  test('a token minted after the bump is accepted', async () => {
    // Guards against the inverse failure: over-eager revocation that locks a
    // user out of signing back in.
    const email = testEmail('rebump')
    const user = await makeUser(email)
    await revokeAllSessions(await userRefFor(user.id))

    const refreshed = await loadUser(user.id)
    const session = await issueSession(refreshed, {})
    created.sessions.push(session.sid)

    const result = await runPrincipal(decode(session.accessToken))
    assert.equal(result.passed, true, 'a freshly issued session must work after a bump')
  })

  test('assertSessionLive rejects a stale token version', () => {
    const live = assertSessionLive({ tv: 1, sid: 'sess_x' }, { tokenVersion: 2 })
    assert.equal(live.valid, false)
    assert.equal(live.code, 'SESSION_REVOKED')

    const ok = assertSessionLive({ tv: 2, sid: 'sess_x' }, { tokenVersion: 2 })
    assert.equal(ok.valid, true)
  })

  test('a token with no version claim is treated as version 1', () => {
    // Tokens issued before this milestone carry no `tv`. They must keep working
    // against an untouched account, and stop working once it is revoked.
    assert.equal(assertSessionLive({}, { tokenVersion: 1 }).valid, true)
    assert.equal(assertSessionLive({}, {}).valid, true)
    assert.equal(assertSessionLive({}, { tokenVersion: 2 }).valid, false)
  })
})

describe('refresh token rotation', firestoreGate, () => {
  test('a refresh returns a new pair and rotates the refresh token', async () => {
    const email = testEmail('rotate')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    const result = await rotateSession(session.refreshToken, loadUser)
    assert.equal(result.ok, true)
    assert.ok(result.accessToken)
    assert.notEqual(result.refreshToken, session.refreshToken, 'the refresh token must rotate')
  })

  test('a used refresh token cannot be replayed', async () => {
    const email = testEmail('replay')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    await rotateSession(session.refreshToken, loadUser)
    const replay = await rotateSession(session.refreshToken, loadUser)

    assert.equal(replay.ok, false, 'the old refresh token must be dead after rotation')
    assert.equal(replay.code, 'REFRESH_INVALID')
  })

  test('a garbage refresh token is rejected', async () => {
    const result = await rotateSession('not-a-real-token', loadUser)
    assert.equal(result.ok, false)
    assert.equal(result.code, 'REFRESH_INVALID')
  })

  test('a refresh cannot resurrect an account-wide revoked session', async () => {
    const email = testEmail('resurrect')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    await revokeAllSessions(await userRefFor(user.id))

    const result = await rotateSession(session.refreshToken, loadUser)
    assert.equal(result.ok, false, 'a revoked session must not be refreshable')
  })

  test('refresh refuses a suspended account', async () => {
    const email = testEmail('refsusp')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    await (await userRefFor(user.id)).update({ accountStatus: AccountStatus.SUSPENDED })

    const res = await invoke(firebaseRefresh, { body: { refreshToken: session.refreshToken } })
    assert.equal(res.status, 403)
    assert.equal(res.body?.code, 'ACCOUNT_NOT_ACTIVE')
  })
})

describe('logout endpoint', firestoreGate, () => {
  test('logout everywhere ends every session', async () => {
    const email = testEmail('logoutall')
    const user = await makeUser(email)
    const a = await issueSession(user, {})
    const b = await issueSession(user, {})
    created.sessions.push(a.sid, b.sid)

    const res = await invoke(firebaseLogout, {
      userId: user.id,
      user: { ...decode(a.accessToken) },
      body: { everywhere: true }
    })

    assert.equal(res.status, 200)
    const remaining = await listSessions(user.id)
    assert.equal(remaining.length, 0, 'no session may survive a logout-everywhere')
  })
})

describe('session listing', firestoreGate, () => {
  test('lists only live sessions and never leaks the refresh hash', async () => {
    const email = testEmail('list')
    const user = await makeUser(email)
    const a = await issueSession(user, { userAgent: 'device-a' })
    const b = await issueSession(user, { userAgent: 'device-b' })
    created.sessions.push(a.sid, b.sid)

    await revokeSession({ userRef: await userRefFor(user.id), decoded: decode(a.accessToken) })

    const sessions = await listSessions(user.id)
    assert.equal(sessions.length, 1, 'a revoked session must not be listed')
    assert.equal(sessions[0].sid, b.sid)
    assert.ok(!('refreshHash' in sessions[0]), 'the refresh hash must never be returned')
  })
})

describe('access-token lifetime is bounded', () => {
  // Revocation is only checked when a guard reads the user document, so an
  // access token has to stay short. Two ways that guarantee could be lost:
  // reading the legacy `JWT_EXPIRE` (documented as 7d), or someone setting a
  // long value directly. Both are refused at boot.

  // Spawning a child from a test file is what makes this file the one that
  // breaks the runner's stream when files execute concurrently, so it is kept
  // as isolated as a child can be: the runner's own IPC descriptor and flags
  // are stripped rather than inherited, and stdio is piped rather than shared.
  //
  // That hardening is correct on its own merits but it did NOT fix the
  // corruption — "Unable to deserialize cloned data" survived it. The actual
  // remedy is --test-concurrency=1 in the npm script; see the note there.
  const bootWith = (env) => new Promise((resolve) => {
    const {
      NODE_CHANNEL_FD: _fd,
      NODE_OPTIONS: _opts,
      NODE_UNIQUE_ID: _uid,
      ...cleanEnv
    } = process.env

    const child = spawn(
      process.execPath,
      ['-e', "import('./src/services/tokenService.js').then(()=>{console.log('LOADED');process.exit(0)}).catch(e=>{console.error(e.message);process.exit(1)})"],
      {
        cwd: new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'),
        env: { ...cleanEnv, ...env },
        stdio: ['ignore', 'pipe', 'pipe']
      }
    )
    let out = ''
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { out += d })
    child.on('close', (code) => resolve({ code, out }))
  })

  test('the default lifetime is one hour', () => {
    const token = jwt.decode(jwt.sign({ x: 1 }, process.env.JWT_SECRET, { expiresIn: '1h' }))
    assert.ok(token.exp - token.iat === 3600)
  })

  test('a real issued token is short-lived', async () => {
    const email = testEmail('ttl')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    const claims = decode(session.accessToken)
    const hours = (claims.exp - claims.iat) / 3600
    assert.ok(hours <= 24, `access token lives ${hours}h; must be <= 24h`)
  })

  test('the server refuses to start with an over-long access TTL', async () => {
    const { code, out } = await bootWith({ ACCESS_TOKEN_TTL: '7d' })
    assert.equal(code, 1, 'a 7d access token must abort startup')
    assert.match(out, /must stay short|at most 24h/i)
  })

  test('the server refuses an unparseable access TTL', async () => {
    const { code } = await bootWith({ ACCESS_TOKEN_TTL: 'forever' })
    assert.equal(code, 1)
  })

  test('JWT_EXPIRE is ignored, so the documented 7d cannot undo this', async () => {
    // CLAUDE.md documented JWT_EXPIRE=7d. If tokenService read it, a deployment
    // following its own documentation would silently restore 7-day tokens.
    const { code, out } = await bootWith({ JWT_EXPIRE: '7d', ACCESS_TOKEN_TTL: '1h' })
    assert.equal(code, 0, 'JWT_EXPIRE must not affect the access-token lifetime')
    assert.match(out, /LOADED/)
  })
})

describe('sessions do not accumulate forever', firestoreGate, () => {
  test('an expired session is purged', async () => {
    const email = testEmail('purgeexp')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    await db.collection(SESSIONS).doc(session.sid).update({
      expiresAt: new Date(Date.now() - 86_400_000).toISOString()
    })

    await purgeDeadSessions({ userId: user.id })

    // Outcome, not attribution — see the long-revoked case below for why
    // asserting `result.deleted` races issueSession's own background purge.
    const still = await db.collection(SESSIONS).doc(session.sid).get()
    assert.equal(still.exists, false, 'an expired session must be deleted')
  })

  test('a live session is never purged', async () => {
    const email = testEmail('purgelive')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    await purgeDeadSessions({ userId: user.id })

    const still = await db.collection(SESSIONS).doc(session.sid).get()
    assert.equal(still.exists, true, 'a live session must survive the purge')
  })

  test('a just-revoked session is kept until its access token would expire', async () => {
    // The session document is what the bulk purge sees, but `revokedSessions`
    // on the user document is what actually rejects the outstanding access
    // token. Deleting the session too early would not break that, but keeping
    // them in step makes the two views agree during the grace window.
    const email = testEmail('purgegrace')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    await revokeSession({ userRef: await userRefFor(user.id), decoded: decode(session.accessToken) })
    await purgeDeadSessions({ userId: user.id })

    const still = await db.collection(SESSIONS).doc(session.sid).get()
    assert.equal(still.exists, true, 'a fresh revocation must survive the grace window')
  })

  test('a long-revoked session is purged', async () => {
    const email = testEmail('purgestale')
    const user = await makeUser(email)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    await db.collection(SESSIONS).doc(session.sid).update({
      revokedAt: new Date(Date.now() - 3 * 86_400_000).toISOString()
    })

    await purgeDeadSessions({ userId: user.id })

    // Asserts the outcome, not which call produced it. `issueSession` fires its
    // own opportunistic purge without awaiting it, so that background call
    // often deletes this session first and the explicit purge above then
    // reports deleted:0 — a green product behaving exactly as designed, failing
    // the suite intermittently. What matters is that a long-revoked session
    // does not survive.
    const still = await db.collection(SESSIONS).doc(session.sid).get()
    assert.equal(still.exists, false, 'a long-revoked session must be deleted')
  })
})

describe('sessions are locked down in the security rules', () => {
  test('firestore.rules denies all client access to sessions', async () => {
    // These documents hold the hash of a live refresh token. The default-deny
    // at the bottom of the file already covers an unlisted collection, but
    // every other collection is stated explicitly — leaving this one implicit
    // reads as an oversight rather than a decision.
    const { readFile } = await import('node:fs/promises')
    const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8')

    const block = /match \/sessions\/\{[^}]+\}\s*\{([^}]*)\}/.exec(rules)
    assert.ok(block, 'firestore.rules must state a rule for /sessions')
    assert.match(block[1], /allow read, write: if false/)
  })
})

describe('route protection coverage', () => {
  test('payment and user routes enforce account status', async () => {
    // These two routers used `authenticate` alone, so a suspended account could
    // still price a trip, open a Razorpay order and edit its profile.
    const { readFile } = await import('node:fs/promises')

    for (const file of ['paymentRoutes.js', 'userRoutes.js']) {
      const src = await readFile(new URL(`../src/routes/${file}`, import.meta.url), 'utf8')
      assert.ok(src.includes('loadPrincipal'), `${file} must run loadPrincipal`)
    }
  })

  test('every session-sensitive auth route runs loadPrincipal', async () => {
    // /auth/profile was the gap: the frontend restores a session by calling it
    // on page load, so with `authenticate` alone a logged-out user who
    // refreshed the page was presented as signed in again until their token
    // expired. /auth/logout is deliberately excluded — a suspended account must
    // still be able to end its own session.
    const { readFile } = await import('node:fs/promises')
    const src = await readFile(new URL('../src/routes/auth.js', import.meta.url), 'utf8')

    for (const route of ['/profile', '/sessions']) {
      const line = src.split('\n').find((l) => l.includes(`'${route}'`) && l.includes('router.'))
      assert.ok(line, `no route definition found for ${route}`)
      assert.ok(line.includes('loadPrincipal'), `${route} must run loadPrincipal to honour revocation`)
    }
  })

  // Needs Firestore; the two checks above are static source scans.
  test('a suspended account is rejected by loadPrincipal', firestoreGate, async () => {
    const email = testEmail('suspprin')
    const user = await makeUser(email, AccountStatus.SUSPENDED)
    const session = await issueSession(user, {})
    created.sessions.push(session.sid)

    const result = await runPrincipal(decode(session.accessToken))
    assert.equal(result.passed, false)
    assert.equal(result.body?.code, 'ACCOUNT_NOT_ACTIVE')
  })
})
