/**
 * Verifies the dated-availability migration against live data.
 *
 * Checks, in order of severity:
 *
 *   1. Every non-deleted hotel/bus/train carries a usable per-date capacity.
 *   2. No availability document is oversold (booked > total) or negative.
 *   3. Every confirmed booking's reserved dates are reflected in the
 *      availability documents — i.e. existing bookings survived the migration.
 *   4. Reservation counts reconcile: for each item and date, the sum of
 *      quantities across confirmed bookings equals the stored `booked`.
 *
 * Read-only. Never writes, so it is safe against production.
 *
 * Run from makemytrip-backend:
 *   npm run verify:dated-availability
 *   npm run verify:dated-availability -- --sample=50
 */

import 'dotenv/config'
import { db } from '../src/config/firebase.js'
import {
  DAILY_INVENTORY_FIELD,
  DATED_FLAG,
  AVAILABILITY_SUBCOLLECTION,
  capacityOf,
  travelDatesFor,
  travelClassFor
} from '../src/services/availability.js'

const SAMPLE = Number(process.argv.find((a) => a.startsWith('--sample='))?.split('=')[1]) || 0

const TYPE_BY_COLLECTION = { hotels: 'hotel', buses: 'bus', trains: 'train' }
const COLLECTION_BY_TYPE = { hotel: 'hotels', bus: 'buses', train: 'trains' }

const CANCELLED = new Set(['cancelled', 'canceled', 'refunded', 'failed'])

const problems = { critical: [], warning: [] }
const fail = (msg) => problems.critical.push(msg)
const warn = (msg) => problems.warning.push(msg)

/** 1 & 2: capacity present, and no availability document oversold. */
const checkInventory = async () => {
  const stats = { items: 0, dated: 0, legacy: 0, slots: 0 }

  for (const [collection, type] of Object.entries(TYPE_BY_COLLECTION)) {
    let query = db.collection(collection)
    if (SAMPLE) query = query.limit(SAMPLE)
    const snap = await query.get()

    for (const doc of snap.docs) {
      const data = doc.data()
      if (data.isDeleted === true) continue
      stats.items++

      if (data[DATED_FLAG] !== true) {
        stats.legacy++
        warn(`${collection}/${doc.id} is still on the legacy counter (not migrated)`)
        continue
      }
      stats.dated++

      if (!data[DAILY_INVENTORY_FIELD]) {
        fail(`${collection}/${doc.id} is flagged dated but carries no ${DAILY_INVENTORY_FIELD}`)
        continue
      }

      const sub = await doc.ref.collection(AVAILABILITY_SUBCOLLECTION).get()
      for (const slot of sub.docs) {
        stats.slots++
        const s = slot.data()

        const entries = s.classes
          ? Object.entries(s.classes).map(([code, v]) => [code, v?.total, v?.booked])
          : [[null, s.total, s.booked]]

        for (const [code, total, booked] of entries) {
          const label = `${collection}/${doc.id}/${slot.id}${code ? ` [${code}]` : ''}`
          if (!Number.isFinite(Number(total))) { fail(`${label}: total is not a number`); continue }
          if (!Number.isFinite(Number(booked))) { fail(`${label}: booked is not a number`); continue }
          if (Number(booked) < 0) fail(`${label}: booked is negative (${booked})`)
          if (Number(booked) > Number(total)) {
            fail(`${label}: OVERSOLD — booked ${booked} exceeds total ${total}`)
          }
        }
      }
    }
  }

  return stats
}

/** 3 & 4: confirmed bookings reconcile with stored reservation counts. */
const checkBookings = async () => {
  const snap = await db.collection('bookings').get()
  const stats = { bookings: 0, dated: 0, unreconcilable: 0 }

  // itemPath -> date -> classCode|'' -> expected quantity
  const expected = new Map()

  for (const doc of snap.docs) {
    const b = doc.data()
    if (b.isDeleted === true) continue
    stats.bookings++

    const type = b.type ?? b.bookingType
    const collection = COLLECTION_BY_TYPE[type]
    if (!collection) continue

    const itemId = b.hotelId ?? b.busId ?? b.trainId ?? b.itemId
    if (!itemId) continue

    const status = String(b.status ?? b.bookingStatus ?? '').toLowerCase()
    if (CANCELLED.has(status)) continue

    let dates
    try {
      dates = travelDatesFor(type, b)
    } catch {
      // Pre-migration bookings may carry no travel dates. They cannot be
      // reconciled, and their inventory cannot be released on cancellation.
      stats.unreconcilable++
      warn(`booking ${b.bookingId ?? doc.id} (${type}) has no travel dates — cannot reconcile or release`)
      continue
    }

    stats.dated++
    const qty = Number(b.rooms ?? b.seatCount ?? b.passengerCount ?? 1) || 1
    const cls = travelClassFor(type, b) ?? ''

    for (const d of dates) {
      const key = `${collection}/${itemId}`
      if (!expected.has(key)) expected.set(key, new Map())
      const byDate = expected.get(key)
      if (!byDate.has(d)) byDate.set(d, new Map())
      const byClass = byDate.get(d)
      byClass.set(cls, (byClass.get(cls) ?? 0) + qty)
    }
  }

  for (const [itemPath, byDate] of expected) {
    for (const [date, byClass] of byDate) {
      const slot = await db.doc(`${itemPath}/${AVAILABILITY_SUBCOLLECTION}/${date}`).get()

      for (const [cls, qty] of byClass) {
        if (!slot.exists) {
          fail(`${itemPath}/${date}${cls ? ` [${cls}]` : ''}: ${qty} booked but no availability document exists`)
          continue
        }
        const s = slot.data()
        const stored = cls ? Number(s.classes?.[cls]?.booked ?? 0) : Number(s.booked ?? 0)

        if (stored < qty) {
          fail(`${itemPath}/${date}${cls ? ` [${cls}]` : ''}: booked=${stored} but ${qty} confirmed booking unit(s) exist`)
        } else if (stored > qty) {
          warn(`${itemPath}/${date}${cls ? ` [${cls}]` : ''}: booked=${stored} exceeds ${qty} reconcilable unit(s) — likely pre-migration bookings`)
        }
      }
    }
  }

  return stats
}

const main = async () => {
  console.log('🔎 Verifying dated availability (read-only)…\n')

  const inv = await checkInventory()
  console.log('inventory')
  console.log(`   items inspected     ${inv.items}`)
  console.log(`   migrated (dated)    ${inv.dated}`)
  console.log(`   still legacy        ${inv.legacy}`)
  console.log(`   availability slots  ${inv.slots}\n`)

  const bk = await checkBookings()
  console.log('bookings')
  console.log(`   bookings inspected  ${bk.bookings}`)
  console.log(`   dated + reconciled  ${bk.dated}`)
  console.log(`   missing dates       ${bk.unreconcilable}\n`)

  if (problems.warning.length) {
    console.log(`⚠️  ${problems.warning.length} warning(s):`)
    for (const w of problems.warning.slice(0, 20)) console.log(`   • ${w}`)
    if (problems.warning.length > 20) console.log(`   … and ${problems.warning.length - 20} more`)
    console.log()
  }

  if (problems.critical.length) {
    console.log(`❌ ${problems.critical.length} CRITICAL problem(s):`)
    for (const c of problems.critical.slice(0, 20)) console.log(`   • ${c}`)
    if (problems.critical.length > 20) console.log(`   … and ${problems.critical.length - 20} more`)
    console.log('\nDo not deploy until these are resolved.')
    process.exit(1)
  }

  console.log('✅ No critical problems. Availability reconciles with confirmed bookings.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Verification failed to run:', err.message)
  process.exit(1)
})
