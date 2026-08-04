/**
 * Production guard for dev/test scripts.
 *
 * Seed and E2E scripts write real Firestore documents, delete entire
 * collections, forge payments, register users, and send real SMTP emails.
 * Running any of them against the production project is destructive.
 *
 * Each such script imports and calls `assertNotProduction()` at the top of
 * main(). It aborts (exit code 1) unless one of these is true:
 *   - NODE_ENV is unset / not 'production'
 *   - the caller passes --i-know-this-runs-on-production
 *   - the Firebase project id is on a known test-project allowlist
 *
 * The allowlist is read from TEST_PROJECT_IDS (comma-separated) so each
 * environment can name its disposable projects without editing this file.
 */

const isTestProject = () => {
  const id = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || ''
  if (!id) return false
  const allow = (process.env.TEST_PROJECT_IDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  return allow.some((p) => p.toLowerCase() === id.toLowerCase())
}

export const assertNotProduction = (reason = 'This script writes live data.') => {
  const env = process.env.NODE_ENV || ''
  const forced = process.argv.includes('--i-know-this-runs-on-production')

  if (env === 'production' && !forced && !isTestProject()) {
    console.error('\n' + '='.repeat(70))
    console.error('⛔  PRODUCTION GUARD — execution stopped.')
    console.error('='.repeat(70))
    console.error(`NODE_ENV=production and this project is not on the test allowlist.`)
    console.error(`${reason}`)
    console.error('This would create/delete real bookings, payments, users and emails.')
    console.error('\nTo override (NOT recommended), pass --i-know-this-runs-on-production,\n')
    console.error('or set TEST_PROJECT_IDS to include this Firebase project id.')
    process.exit(1)
  }

  if (env === 'production') {
    console.warn('\n⚠️  NODE_ENV=production — running because an override is set.\n')
  }
}

export default assertNotProduction
