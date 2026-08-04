/**
 * Deletes session documents that can no longer authenticate anything.
 *
 * WHY: `sessions` gains one document per login and nothing ever removed them.
 * Expired and long-revoked sessions are not a security problem — every guard
 * rejects them — but they are unbounded storage, and they make each per-user
 * session query progressively more expensive.
 *
 * `issueSession` already purges opportunistically within the signing-in user's
 * own records. This script is the bulk sweep for everyone else, intended to run
 * on a schedule.
 *
 * A revoked session is kept until the access token minted with it would have
 * expired anyway, because the `revokedSessions` entry on the user document is
 * what rejects that token in the meantime.
 *
 * Run from makemytrip-backend:
 *   node scripts/purgeExpiredSessions.js            # report only
 *   node scripts/purgeExpiredSessions.js --apply    # delete them
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import { SESSIONS } from '../src/services/tokenService.js'
import assertNotProduction from './lib/prodGuard.js'

const banner = (t) => console.log('\n' + '='.repeat(60) + '\n' + t + '\n' + '='.repeat(60))

const accessTtlMs = () => {
  const match = /^(\d+)([smhd])$/.exec(String(process.env.ACCESS_TOKEN_TTL || '1h').trim())
  if (!match) return 60 * 60 * 1000
  const [, value, unit] = match
  const ms = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]
  return Number(value) * ms
}

const main = async () => {
  const apply = process.argv.includes('--apply')

  // Deletes documents in bulk; never let it run unguarded against production.
  assertNotProduction('This script deletes session documents.')

  banner(apply ? 'SESSION PURGE (APPLYING)' : 'SESSION PURGE (DRY RUN)')

  const snap = await db.collection(SESSIONS).get()
  const now = Date.now()
  const revokedGrace = accessTtlMs() + 60_000

  const expired = []
  const staleRevoked = []
  let live = 0

  for (const doc of snap.docs) {
    const s = doc.data()
    if (s.expiresAt && new Date(s.expiresAt).getTime() < now) {
      expired.push(doc)
    } else if (s.revokedAt && (now - new Date(s.revokedAt).getTime()) > revokedGrace) {
      staleRevoked.push(doc)
    } else {
      live++
    }
  }

  console.log(`Scanned ${snap.size} session document(s).`)
  console.log(`  • ${live} live`)
  console.log(`  • ${expired.length} past their refresh expiry`)
  console.log(`  • ${staleRevoked.length} revoked longer ago than one access-token lifetime`)

  if (!apply) {
    console.log('\nDry run — nothing was deleted. Re-run with --apply.')
    return
  }

  const doomed = [...expired, ...staleRevoked]
  for (let i = 0; i < doomed.length; i += 400) {
    const batch = db.batch()
    doomed.slice(i, i + 400).forEach((d) => batch.delete(d.ref))
    await batch.commit()
  }

  banner('✅ PURGE COMPLETE')
  console.log(`  ${doomed.length} session document(s) deleted, ${live} left live.`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Purge failed:', err)
    process.exit(1)
  })
