import { db } from '../src/config/firebase.js'

/**
 * Fail-fast probe for Firestore availability.
 *
 * The Admin SDK retries RESOURCE_EXHAUSTED and UNAVAILABLE with exponential
 * backoff for several minutes. In a test run that turns "the quota is gone"
 * into a ten-minute hang with no output, which is indistinguishable from a
 * deadlock and blocks CI.
 *
 * Suites that touch Firestore call `requireFirestore()` once at module load.
 * If the datastore is not reachable they report why and skip, so the suites
 * that need no datastore still run and still gate merges.
 */

const PROBE_TIMEOUT_MS = Number(process.env.TEST_FIRESTORE_PROBE_MS) || 8000

let cached = null

const withTimeout = (promise, ms) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('probe timed out')), ms).unref?.())
])

/**
 * @returns {Promise<{available: boolean, reason: string|null}>}
 */
export const probeFirestore = async () => {
  if (cached) return cached

  try {
    await withTimeout(db.collection('users').limit(1).get(), PROBE_TIMEOUT_MS)
    cached = { available: true, reason: null }
  } catch (err) {
    const message = String(err?.message ?? err)
    const reason = /RESOURCE_EXHAUSTED|Quota exceeded/i.test(message)
      ? 'Firestore daily quota is exhausted'
      : /timed out/i.test(message)
        ? 'Firestore did not respond'
        : message.split('\n')[0]

    cached = { available: false, reason }
  }

  return cached
}

/**
 * Resolves to a `{ skip }` object suitable for spreading into node:test
 * options, so a suite degrades to "skipped, and here is why" rather than
 * hanging or reporting a misleading failure.
 *
 *   const gate = await requireFirestore()
 *   describe('…', gate, () => { … })
 */
export const requireFirestore = async () => {
  const { available, reason } = await probeFirestore()
  if (available) return {}

  console.warn(`\n⚠️  Skipping Firestore-backed tests: ${reason}`)
  console.warn('   Run `npm run verify:all` once the datastore is reachable.\n')

  return { skip: `Firestore unavailable — ${reason}` }
}

export default { probeFirestore, requireFirestore }
