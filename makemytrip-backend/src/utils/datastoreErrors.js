/**
 * Recognises datastore failures that are not the caller's fault.
 *
 * Written after a day lost to a login screen that said "Login failed" while the
 * real cause was an exhausted Firestore read quota. Login *is* a read, so when
 * the quota goes the lookup throws and every controller's catch-all reported it
 * as a failed login. The admin, the vendor and the customer all saw a message
 * telling them their password was the problem.
 *
 * That is the worst kind of error message: confidently wrong, and pointing at
 * the one thing that was fine. These helpers let a controller say "the database
 * is unavailable" when that is what happened.
 *
 * Firestore surfaces these as gRPC status codes:
 *   8  RESOURCE_EXHAUSTED  quota gone (free tier: 50k reads/day)
 *   14 UNAVAILABLE         transient backend outage
 *   4  DEADLINE_EXCEEDED   timed out
 */

const RETRYABLE_CODES = new Set([8, 14, 4])

const QUOTA_PATTERN = /RESOURCE_EXHAUSTED|Quota exceeded/i
const UNAVAILABLE_PATTERN = /UNAVAILABLE|DEADLINE_EXCEEDED|ECONNRESET|ETIMEDOUT/i

/** True when the datastore refused the request for reasons the caller cannot fix. */
export const isDatastoreUnavailable = (err) => {
  if (!err) return false
  if (RETRYABLE_CODES.has(err.code)) return true
  const text = `${err.message ?? ''} ${err.details ?? ''}`
  return QUOTA_PATTERN.test(text) || UNAVAILABLE_PATTERN.test(text)
}

/** True specifically when the daily quota is gone, which needs a plan change, not a retry. */
export const isQuotaExhausted = (err) => {
  if (!err) return false
  if (err.code === 8) return true
  return QUOTA_PATTERN.test(`${err.message ?? ''} ${err.details ?? ''}`)
}

/**
 * Sends a 503 if the datastore is the problem. Returns true when it handled the
 * response, so a controller reads:
 *
 *   } catch (err) {
 *     if (respondIfDatastoreDown(res, err, 'Sign-in')) return
 *     …its own error handling…
 *   }
 *
 * 503 rather than 500 is deliberate: this is "come back later", not "your
 * request was wrong", and it tells monitoring the difference too.
 */
export const respondIfDatastoreDown = (res, err, what = 'This action') => {
  if (!isDatastoreUnavailable(err)) return false

  const quota = isQuotaExhausted(err)
  console.error(`⛔ ${what} failed — datastore ${quota ? 'quota exhausted' : 'unavailable'}: ${err.message}`)

  res.status(503).json({
    success: false,
    code: quota ? 'DATASTORE_QUOTA_EXCEEDED' : 'DATASTORE_UNAVAILABLE',
    message: quota
      ? 'The database has hit its daily limit, so nothing can be read right now. This is not a problem with your details. It resets at midnight US Pacific, or upgrade the Firebase plan to clear it immediately.'
      : 'The database is temporarily unreachable. Please try again in a moment.'
  })
  return true
}

export default { isDatastoreUnavailable, isQuotaExhausted, respondIfDatastoreDown }
