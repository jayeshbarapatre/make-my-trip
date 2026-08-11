/**
 * Runs the whole inventory bootstrap in the one order that works, and stops at
 * the first step that fails rather than leaving the data half-migrated.
 *
 *   1. migrate:timestamps   date fields must be one type before anything is indexed
 *   2. migrate:route-index  denormalise canonical from/to/city onto every document
 *   3. seed:coverage        create inventory on every route the UI can produce
 *   4. verify:search        results, filters, sorting, pagination, availability
 *   5. verify:booking       search -> payment -> booking -> My Trips -> PDF -> invoice
 *
 * Order matters. Seeding before the route backfill would write documents the
 * indexed search cannot see; verifying before seeding reports holes that are
 * about to be filled.
 *
 * Waits for Firestore when the daily quota is exhausted rather than failing, so
 * this can be started ahead of the reset and left to run.
 *
 *   npm run bootstrap            # dry run of every step
 *   npm run bootstrap -- --apply # execute
 *   npm run bootstrap -- --apply --wait 3600   # wait up to an hour for quota
 */

import 'dotenv/config'
import { spawn } from 'node:child_process'
import { db } from '../src/config/firebase.js'

const banner = (t) => console.log('\n' + '█'.repeat(72) + '\n█ ' + t + '\n' + '█'.repeat(72))

const arg = (name, fallback = null) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : (process.argv[i + 1] ?? true)
}

const APPLY = process.argv.includes('--apply')
const WAIT_SECONDS = Number(arg('wait', 0)) || 0

// The full validation pipeline, in dependency order.
//
// `covers` records which acceptance criteria a stage actually proves, so a
// green run maps onto the acceptance list rather than just "the script exited
// zero". Firestore persistence, My Trips, invoice and PDF are all asserted
// inside verifyBookingFlow — they are stages of one booking, not separate runs.
const STEPS = [
  {
    name: 'Normalise timestamps',
    script: 'scripts/normalizeTimestamps.js',
    mutates: true,
    covers: ['date fields are a single indexable type']
  },
  {
    name: 'Backfill route index',
    script: 'scripts/backfillRouteIndex.js',
    mutates: true,
    covers: ['route migration']
  },
  {
    name: 'Seed route coverage',
    script: 'scripts/seedRouteCoverage.js',
    mutates: true,
    covers: ['inventory seeding']
  },
  {
    name: 'Verify search',
    script: 'scripts/verifySearch.js',
    mutates: false,
    covers: ['search', 'filters', 'sorting', 'pagination', 'availability']
  },
  {
    name: 'Verify booking flow',
    script: 'scripts/verifyBookingFlow.js',
    mutates: false,
    covers: ['booking', 'Firestore persistence', 'My Trips', 'invoice', 'PDF', 'email render']
  },
  {
    name: 'Full regression',
    script: null,
    npm: 'test',
    mutates: false,
    covers: ['regression: auth, RBAC, coupons, cancellation, rules, indexes, Docker']
  }
]

// The shell is for npm only. `npm` on Windows is a .cmd shim, which Node will
// not execute without one — but routing node through the same shell broke every
// step on a default Windows install, because `process.execPath` is
// "C:\Program Files\nodejs\node.exe" and an unquoted shell command splits it at
// the space ("'C:\Program' is not recognized"). node is a real executable, so
// it is spawned directly and the path survives intact.
const run = (step, args) => new Promise((resolve) => {
  const [cmd, argv] = step.npm
    ? [process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', step.npm]]
    : [process.execPath, [step.script, ...args]]

  const useShell = Boolean(step.npm) && process.platform === 'win32'
  const child = spawn(cmd, argv, { stdio: 'inherit', shell: useShell })
  child.on('close', (code) => resolve(code ?? 1))
  child.on('error', () => resolve(1))
})

/** True once Firestore answers a trivial read. */
const firestoreReachable = async () => {
  try {
    await db.collection('users').limit(1).get()
    return true
  } catch (err) {
    return /RESOURCE_EXHAUSTED|Quota exceeded|UNAVAILABLE/i.test(String(err?.message)) ? false : true
  }
}

const waitForFirestore = async (seconds) => {
  const deadline = Date.now() + seconds * 1000
  let attempt = 0

  while (Date.now() < deadline) {
    if (await firestoreReachable()) return true

    attempt++
    const delay = Math.min(300, 30 * attempt)
    const remaining = Math.round((deadline - Date.now()) / 1000)
    console.log(`  quota unavailable — retrying in ${delay}s (${remaining}s left of the wait window)`)
    await new Promise((r) => setTimeout(r, delay * 1000))
  }

  return firestoreReachable()
}

const main = async () => {
  banner(APPLY ? 'INVENTORY BOOTSTRAP — APPLYING' : 'INVENTORY BOOTSTRAP — DRY RUN')

  if (!(await firestoreReachable())) {
    if (!WAIT_SECONDS) {
      console.error('\n❌ Firestore is not reachable (daily quota exhausted).')
      console.error('   The free-tier quota resets at midnight US/Pacific.')
      console.error('   Re-run with `--wait 3600` to have this poll until it clears.\n')
      return 2
    }
    console.log(`\nFirestore unreachable — waiting up to ${WAIT_SECONDS}s for the quota to reset...`)
    if (!(await waitForFirestore(WAIT_SECONDS))) {
      console.error('\n❌ Quota did not become available within the wait window.\n')
      return 2
    }
    console.log('  Firestore is reachable — continuing.\n')
  }

  // `--from N` re-runs a fixed stage onward without repeating the ones that
  // already passed, which is what a fix-and-retry loop needs.
  const from = Math.max(1, Number(arg('from', 1)) || 1)
  if (from > 1) {
    console.log(`\nResuming from step ${from}; steps 1..${from - 1} are assumed to have passed.\n`)
  }

  const passed = []

  for (const [i, step] of STEPS.entries()) {
    if (i + 1 < from) continue

    banner(`STEP ${i + 1}/${STEPS.length} — ${step.name}`)

    const args = step.mutates && APPLY ? ['--apply'] : []
    const code = await run(step, args)

    if (code !== 0) {
      console.error(`\n❌ Step ${i + 1} (${step.name}) exited ${code}. Stopping.`)
      console.error('   Nothing after this point has run, so the data is not half-applied.')
      console.error('   Fix the cause, then re-run this stage onward:')
      console.error(`     npm run bootstrap -- --apply --from ${i + 1}\n`)
      if (passed.length) {
        console.error('   Passed earlier in this run:')
        passed.forEach((name) => console.error(`     ✓ ${name}`))
      }
      return code
    }

    passed.push(step.name)
  }

  console.log('\nAcceptance criteria proven by this run:')
  for (const step of STEPS.slice(from - 1)) {
    for (const c of step.covers ?? []) console.log(`  ✓ ${c}`)
  }

  banner(APPLY ? 'BOOTSTRAP COMPLETE — all steps passed' : 'DRY RUN COMPLETE — re-run with --apply')
  return 0
}

main()
  .then((code) => process.exit(code))
  .catch((err) => { console.error('Bootstrap crashed:', err); process.exit(1) })
