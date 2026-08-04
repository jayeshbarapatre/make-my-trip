import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../config/firebase.js'

// Session lifecycle.
//
// Tokens used to be stateless, 7-day and irrevocable: `POST /auth/logout`
// returned a message and did nothing server-side, so a stolen token stayed
// valid for a week with no way to kill it, and a password reset left every
// pre-existing session working.
//
// Revocation is now enforced through two signals, BOTH of which are carried on
// the user document that the authorization guards already read. That is the
// whole trick — `loadPrincipal`, `authenticateAdmin` and `authenticateVendor`
// each fetch the user on every request anyway, so revocation costs no extra
// Firestore read on the authenticated hot path:
//
//   tokenVersion      bumped to invalidate EVERY session for an account
//                     (password reset, suspension, "log out everywhere")
//   revokedSessions   individual session ids, so signing out on one device
//                     does not sign you out on the others
//
// `revokedSessions` stays small because entries are dropped once the access
// token they refer to would have expired anyway — it can only ever hold the
// sessions revoked within one access-token lifetime.

const JWT_SECRET = process.env.JWT_SECRET

// Deliberately NOT `JWT_EXPIRE`. That variable is documented in CLAUDE.md as
// `7d` and predates revocable sessions — reading it here would mean a
// deployment that follows its own documentation silently restores 7-day access
// tokens and undoes this milestone. The access TTL gets its own name so the two
// cannot be confused.
const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL || '1h'
const REFRESH_TTL_DAYS = parseInt(process.env.REFRESH_TOKEN_TTL_DAYS, 10) || 30

// An access token is only safe to hold un-revoked for as long as it is short.
// Anything beyond this reopens the window the whole design closes, so it is
// refused rather than quietly honoured.
const MAX_ACCESS_TTL_HOURS = 24

const parseTtlHours = (ttl) => {
  const match = /^(\d+)([smhd])$/.exec(String(ttl).trim())
  if (!match) return null
  const [, value, unit] = match
  const hours = { s: 1 / 3600, m: 1 / 60, h: 1, d: 24 }[unit]
  return Number(value) * hours
}

const accessTtlHours = parseTtlHours(ACCESS_TTL)
if (accessTtlHours === null) {
  throw new Error(
    `ACCESS_TOKEN_TTL is "${ACCESS_TTL}", which is not a valid duration (e.g. 15m, 1h, 12h).`
  )
}
if (accessTtlHours > MAX_ACCESS_TTL_HOURS) {
  throw new Error(
    `ACCESS_TOKEN_TTL is "${ACCESS_TTL}" (${accessTtlHours}h). Access tokens are only checked ` +
    `for revocation when a guard reads the user document, so they must stay short: ` +
    `at most ${MAX_ACCESS_TTL_HOURS}h. Use REFRESH_TOKEN_TTL_DAYS for long-lived sessions.`
  )
}

export const SESSIONS = 'sessions'

/** Hashed before storage so a leaked Firestore export cannot be replayed. */
const hashRefresh = (token) =>
  crypto.createHash('sha256')
    .update(`${token}:${process.env.OTP_PEPPER || JWT_SECRET}`)
    .digest('hex')

const nowIso = () => new Date().toISOString()

/**
 * Seconds until a JWT expires, from its own `exp` claim. Used to decide how
 * long a revoked session id has to stay on the user document.
 */
const secondsUntilExpiry = (decoded) => {
  const exp = Number(decoded?.exp)
  if (!Number.isFinite(exp)) return 3600
  return Math.max(0, exp - Math.floor(Date.now() / 1000))
}

export const currentTokenVersion = (user) => {
  const v = Number(user?.tokenVersion)
  return Number.isFinite(v) && v > 0 ? v : 1
}

/**
 * The authoritative check that a presented token still represents a live
 * session. Runs against the already-fetched user document.
 *
 * @returns {{valid: true} | {valid: false, code: string, message: string}}
 */
export const assertSessionLive = (decoded, user) => {
  if (currentTokenVersion(user) !== currentTokenVersion({ tokenVersion: decoded?.tv })) {
    return {
      valid: false,
      code: 'SESSION_REVOKED',
      message: 'This session has ended. Please sign in again.'
    }
  }

  const sid = decoded?.sid
  if (sid && Array.isArray(user?.revokedSessions)) {
    const hit = user.revokedSessions.some((entry) => entry?.sid === sid)
    if (hit) {
      return {
        valid: false,
        code: 'SESSION_REVOKED',
        message: 'This session has ended. Please sign in again.'
      }
    }
  }

  return { valid: true }
}

export const signAccessToken = (user, sid) =>
  jwt.sign(
    {
      id: user.id,
      email: user.email ?? null,
      role: user.role ?? null,
      accountStatus: user.accountStatus ?? null,
      tv: currentTokenVersion(user),
      sid,
      typ: 'access'
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TTL }
  )

/**
 * Opens a session and returns the token pair.
 *
 * The refresh token is a random secret, not a JWT: it is only ever presented
 * back to this server, so there is nothing to gain from making it readable, and
 * an opaque value cannot leak claims if it is logged somewhere it should not be.
 */
export const issueSession = async (user, { userAgent = null, ip = null } = {}) => {
  const sid = `sess_${crypto.randomBytes(16).toString('hex')}`
  const refreshToken = crypto.randomBytes(48).toString('base64url')
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)

  await db.collection(SESSIONS).doc(sid).set({
    sid,
    userId: user.id,
    userEmail: user.email ?? null,
    refreshHash: hashRefresh(refreshToken),
    createdAt: nowIso(),
    lastUsedAt: nowIso(),
    expiresAt: expiresAt.toISOString(),
    revokedAt: null,
    // Recorded so a user can recognise their own sessions, and so an
    // investigation can tell two sessions apart.
    userAgent: userAgent ? String(userAgent).slice(0, 300) : null,
    ip: ip ?? null,
    isDeleted: false
  })

  // Opportunistic housekeeping, scoped to this user's own records so it stays
  // cheap. Failure must never block a login.
  purgeDeadSessions({ userId: user.id, limit: 20 }).catch(() => {})

  return {
    accessToken: signAccessToken(user, sid),
    refreshToken,
    sid,
    expiresAt: expiresAt.toISOString()
  }
}

/**
 * Exchanges a refresh token for a new pair, rotating the refresh token.
 *
 * Rotation matters: if a refresh token is stolen and used, the legitimate
 * holder's next refresh fails, which surfaces the compromise instead of
 * letting both parties hold a valid session indefinitely.
 */
export const rotateSession = async (refreshToken, loadUserById) => {
  if (!refreshToken || typeof refreshToken !== 'string') {
    return { ok: false, code: 'REFRESH_REQUIRED', message: 'A refresh token is required.' }
  }

  const presented = hashRefresh(refreshToken)

  const snap = await db.collection(SESSIONS)
    .where('refreshHash', '==', presented)
    .limit(1)
    .get()

  if (snap.empty) {
    return { ok: false, code: 'REFRESH_INVALID', message: 'This session is no longer valid. Please sign in again.' }
  }

  const session = snap.docs[0].data()

  if (session.revokedAt) {
    return { ok: false, code: 'REFRESH_REVOKED', message: 'This session has ended. Please sign in again.' }
  }

  if (new Date(session.expiresAt) < new Date()) {
    await snap.docs[0].ref.update({ revokedAt: nowIso() }).catch(() => {})
    return { ok: false, code: 'REFRESH_EXPIRED', message: 'This session has expired. Please sign in again.' }
  }

  const user = await loadUserById(session.userId)
  if (!user) {
    return { ok: false, code: 'ACCOUNT_GONE', message: 'This account no longer exists.' }
  }

  // A refresh must not resurrect a session the account has already invalidated.
  const live = assertSessionLive({ tv: session.tokenVersionAtIssue ?? currentTokenVersion(user), sid: session.sid }, user)
  if (!live.valid) {
    return { ok: false, code: live.code, message: live.message }
  }

  const nextRefresh = crypto.randomBytes(48).toString('base64url')
  await snap.docs[0].ref.update({
    refreshHash: hashRefresh(nextRefresh),
    lastUsedAt: nowIso()
  })

  return {
    ok: true,
    user,
    accessToken: signAccessToken(user, session.sid),
    refreshToken: nextRefresh,
    sid: session.sid
  }
}

/**
 * Ends one session: the refresh token stops working immediately, and the
 * already-issued access token is rejected by the guards from now on.
 */
export const revokeSession = async ({ userRef, decoded }) => {
  const sid = decoded?.sid
  if (!sid) return { revoked: false }

  await db.collection(SESSIONS).doc(sid).update({ revokedAt: nowIso() }).catch(() => {})

  if (!userRef) return { revoked: true, sid }

  // Park the session id on the user document until the access token that
  // carries it would have expired anyway, then it can be dropped.
  const snap = await userRef.get()
  const existing = Array.isArray(snap.data()?.revokedSessions) ? snap.data().revokedSessions : []
  const cutoff = Date.now()

  const pruned = existing.filter((e) => e?.expiresAtMs && e.expiresAtMs > cutoff)
  pruned.push({ sid, expiresAtMs: cutoff + secondsUntilExpiry(decoded) * 1000 + 60_000 })

  await userRef.update({ revokedSessions: pruned, updatedAt: nowIso() })

  return { revoked: true, sid }
}

/**
 * Ends every session for an account. Used by "log out everywhere", by a
 * password reset, and whenever an account is suspended or disabled — all cases
 * where a session that predates the event must not survive it.
 */
export const revokeAllSessions = async (userRef) => {
  if (!userRef) return { revoked: false }

  await userRef.update({
    tokenVersion: FieldValue.increment(1),
    // Every session is dead now, so per-session entries are redundant.
    revokedSessions: [],
    updatedAt: nowIso()
  })

  const snap = await userRef.get()
  const userId = snap.data()?.id
  if (!userId) return { revoked: true, sessions: 0 }

  const sessions = await db.collection(SESSIONS)
    .where('userId', '==', userId)
    .where('revokedAt', '==', null)
    .get()
    .catch(() => ({ docs: [] }))

  for (const doc of sessions.docs) {
    await doc.ref.update({ revokedAt: nowIso() }).catch(() => {})
  }

  return { revoked: true, sessions: sessions.docs.length }
}

/** Sessions a user can see and manage in their account settings. */
export const listSessions = async (userId) => {
  const snap = await db.collection(SESSIONS).where('userId', '==', userId).get()
  return snap.docs
    .map((d) => d.data())
    .filter((s) => !s.revokedAt && new Date(s.expiresAt) > new Date())
    .map(({ refreshHash: _omit, ...safe }) => safe)
    .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
}

/**
 * Deletes sessions that can no longer authenticate anything: expired, or
 * revoked long enough ago that the access token issued with them is dead too.
 *
 * Without this the collection grows by one document per login forever. A
 * revoked or expired session is not a security problem — the guards reject it
 * either way — but it is unbounded storage and it makes every per-user session
 * query progressively more expensive.
 *
 * Called opportunistically when a user opens a new session (bounded to their
 * own records, so it costs nothing at login), and in bulk by
 * `scripts/purgeExpiredSessions.js`.
 */
export const purgeDeadSessions = async ({ userId = null, limit = 50 } = {}) => {
  let query = db.collection(SESSIONS)
  if (userId) query = query.where('userId', '==', userId)

  const snap = await query.limit(limit).get()
  const now = Date.now()
  // A revoked session still has to outlive the access token minted with it,
  // because `revokedSessions` on the user document is what rejects that token.
  const revokedGrace = (accessTtlHours * 60 * 60 * 1000) + 60_000

  let deleted = 0
  for (const doc of snap.docs) {
    const s = doc.data()
    const expired = s.expiresAt && new Date(s.expiresAt).getTime() < now
    const staleRevoked = s.revokedAt && (now - new Date(s.revokedAt).getTime()) > revokedGrace

    if (expired || staleRevoked) {
      await doc.ref.delete().catch(() => {})
      deleted++
    }
  }

  return { scanned: snap.size, deleted }
}

export default {
  issueSession,
  rotateSession,
  revokeSession,
  revokeAllSessions,
  listSessions,
  assertSessionLive,
  signAccessToken,
  currentTokenVersion
}
