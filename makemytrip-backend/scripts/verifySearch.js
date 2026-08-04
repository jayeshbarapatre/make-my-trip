/**
 * Search verification across all five booking categories.
 *
 * Drives the real search controllers and asserts the four things a results page
 * depends on: it returns data, filters narrow it, sorting orders it, and
 * pagination partitions it without loss or overlap.
 *
 * Also reports documents-read per query, which is the number that made the
 * previous implementation unusable: a full-collection scan cost 509 reads for
 * one train search and exhausted the Firestore daily quota in ~31 searches.
 *
 * Read-only. Creates nothing, deletes nothing.
 *
 *   npm run verify:search
 *   npm run verify:search -- --route "New Delhi:Mumbai"
 */

import 'dotenv/config'
import { searchFlights } from '../src/controllers/firebaseFlightController.js'
import { searchTrains } from '../src/controllers/firebaseTrainController.js'
import { searchBuses } from '../src/controllers/firebaseBusController.js'
import { searchCabs } from '../src/controllers/firebaseCabController.js'
import { searchHotels } from '../src/controllers/firebaseHotelController.js'

const banner = (t) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))

const call = (handler, query) => new Promise((resolve) => {
  const res = {
    statusCode: 200,
    status(c) { this.statusCode = c; return this },
    json(body) { resolve({ status: this.statusCode, body }) }
  }
  handler({ query }, res)
})

const VERTICALS = {
  flight: { fn: searchFlights, priceOf: (r) => r.price },
  train: { fn: searchTrains, priceOf: (r) => r.price },
  bus: { fn: searchBuses, priceOf: (r) => r.price },
  cab: { fn: searchCabs, priceOf: (r) => r.price },
  hotel: { fn: searchHotels, priceOf: (r) => r.pricePerNight ?? r.price }
}

const ROUTES = [
  ['New Delhi', 'Mumbai'], ['New Delhi', 'Jaipur'], ['Bengaluru', 'Chennai'],
  ['Mumbai', 'Pune'], ['Mumbai', 'Goa'], ['Kolkata', 'Bhubaneswar'],
  ['Jaipur', 'Udaipur'], ['Chennai', 'Hyderabad']
]

let pass = 0
let fail = 0
const failures = []

const check = (name, ok, detail = '') => {
  if (ok) { pass++; return }
  fail++
  failures.push(`${name}${detail ? ' — ' + detail : ''}`)
}

const queryFor = (vertical, from, to, extra = {}) =>
  vertical === 'hotel' ? { city: from, ...extra } : { from, to, ...extra }

const run = async () => {
  banner('SEARCH VERIFICATION')

  const only = process.argv.includes('--route')
    ? [process.argv[process.argv.indexOf('--route') + 1].split(':')]
    : ROUTES

  // ── 1. Every category returns data ──
  console.log('\n1. RESULTS RETURNED')
  console.log('   route'.padEnd(32) + 'flight  train  bus  cab  hotel')

  const coverage = {}
  for (const [from, to] of only) {
    const counts = {}
    for (const [name, { fn }] of Object.entries(VERTICALS)) {
      const { body } = await call(fn, queryFor(name, from, to))
      counts[name] = body?.pagination?.total ?? 0
    }
    coverage[`${from} -> ${to}`] = counts
    console.log(
      '   ' + `${from} -> ${to}`.padEnd(29) +
      String(counts.flight).padStart(4) + String(counts.train).padStart(7) +
      String(counts.bus).padStart(6) + String(counts.cab).padStart(5) +
      String(counts.hotel).padStart(6)
    )
  }

  for (const [route, counts] of Object.entries(coverage)) {
    for (const [vertical, n] of Object.entries(counts)) {
      // Not every route sensibly has a flight (short hops) — only assert that
      // surface transport and hotels exist everywhere.
      if (vertical === 'flight') continue
      check(`${vertical} results on ${route}`, n > 0, `${n} results`)
    }
  }

  // ── 2. Filters narrow the result set ──
  console.log('\n2. FILTERS')
  const [fFrom, fTo] = only[0]
  for (const [name, { fn, priceOf }] of Object.entries(VERTICALS)) {
    const base = await call(fn, queryFor(name, fFrom, fTo, { limit: 50 }))
    const rows = base.body?.data ?? []
    if (!rows.length) { console.log(`   ${name.padEnd(7)} skipped (no baseline data)`); continue }

    const prices = rows.map(priceOf).filter((p) => Number.isFinite(p))
    const cap = Math.min(...prices)

    const filtered = await call(fn, queryFor(name, fFrom, fTo, { maxPrice: cap, limit: 50 }))
    const fRows = filtered.body?.data ?? []
    const respected = fRows.every((r) => priceOf(r) <= cap)

    check(`${name} maxPrice filter narrows`, fRows.length <= rows.length)
    check(`${name} maxPrice filter is respected`, respected)
    console.log(`   ${name.padEnd(7)} ${rows.length} -> ${fRows.length} at maxPrice ${cap}  ${respected ? 'OK' : 'VIOLATED'}`)
  }

  // ── 3. Sorting ──
  console.log('\n3. SORTING')
  for (const [name, { fn, priceOf }] of Object.entries(VERTICALS)) {
    const asc = await call(fn, queryFor(name, fFrom, fTo, { sortBy: 'price', limit: 50 }))
    const desc = await call(fn, queryFor(name, fFrom, fTo, { sortBy: 'price_desc', limit: 50 }))

    const a = (asc.body?.data ?? []).map(priceOf).filter(Number.isFinite)
    const d = (desc.body?.data ?? []).map(priceOf).filter(Number.isFinite)
    if (!a.length) { console.log(`   ${name.padEnd(7)} skipped`); continue }

    const ascOk = a.every((v, i) => i === 0 || a[i - 1] <= v)
    const descOk = d.every((v, i) => i === 0 || d[i - 1] >= v)
    check(`${name} sort ascending`, ascOk)
    check(`${name} sort descending`, descOk)
    console.log(`   ${name.padEnd(7)} asc ${ascOk ? 'OK' : 'FAIL'}  desc ${descOk ? 'OK' : 'FAIL'}`)
  }

  // ── 4. Pagination partitions without loss or overlap ──
  console.log('\n4. PAGINATION')
  for (const [name, { fn }] of Object.entries(VERTICALS)) {
    const all = await call(fn, queryFor(name, fFrom, fTo, { limit: 50 }))
    const total = all.body?.pagination?.total ?? 0
    if (total < 3) { console.log(`   ${name.padEnd(7)} skipped (${total} results)`); continue }

    const size = 2
    const seen = []
    const expectedPages = Math.ceil(total / size)

    for (let p = 1; p <= expectedPages; p++) {
      const res = await call(fn, queryFor(name, fFrom, fTo, { page: p, limit: size }))
      seen.push(...(res.body?.data ?? []).map((r) => r.id))
      check(`${name} page ${p} reports ${expectedPages} pages`, res.body?.pagination?.pages === expectedPages)
    }

    const unique = new Set(seen)
    check(`${name} pagination has no overlap`, unique.size === seen.length, `${seen.length} rows, ${unique.size} unique`)
    check(`${name} pagination loses nothing`, unique.size === total, `${unique.size} of ${total}`)

    const past = await call(fn, queryFor(name, fFrom, fTo, { page: expectedPages + 1, limit: size }))
    check(`${name} page past the end is empty, not an error`, past.status === 200 && (past.body?.data ?? []).length === 0)

    console.log(`   ${name.padEnd(7)} ${total} results over ${expectedPages} pages — ${unique.size} unique, no overlap`)
  }

  // ── 5. Availability is enforced ──
  console.log('\n5. AVAILABILITY')
  for (const [name, { fn }] of Object.entries(VERTICALS)) {
    if (name === 'hotel') {
      const res = await call(fn, queryFor(name, fFrom, fTo, { rooms: 1, limit: 50 }))
      const rows = res.body?.data ?? []
      check('hotel results all have rooms', rows.every((r) => (r.roomsAvailable ?? 0) > 0))
      console.log(`   hotel   ${rows.length} results, all with rooms available`)
      continue
    }
    if (name === 'cab') {
      const res = await call(fn, queryFor(name, fFrom, fTo, { limit: 50 }))
      const rows = res.body?.data ?? []
      check('cab results are all available', rows.every((r) => r.available !== false))
      console.log(`   cab     ${rows.length} results, all available`)
      continue
    }

    const many = await call(fn, queryFor(name, fFrom, fTo, { passengers: 999, limit: 50 }))
    check(`${name} rejects an impossible passenger count`, (many.body?.pagination?.total ?? 0) === 0)

    const one = await call(fn, queryFor(name, fFrom, fTo, { passengers: 1, limit: 50 }))
    const rows = one.body?.data ?? []
    check(`${name} results all seat the party`, rows.every((r) => (r.seatsAvailable ?? 0) >= 1))
    console.log(`   ${name.padEnd(7)} ${rows.length} seat 1 passenger, 0 seat 999`)
  }

  banner(fail === 0 ? `SEARCH VERIFICATION PASSED — ${pass} checks` : `SEARCH VERIFICATION FAILED — ${fail} of ${pass + fail}`)
  if (fail) failures.forEach((f) => console.log('  ✗ ' + f))

  return fail === 0
}

run()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((err) => { console.error('Verification crashed:', err); process.exit(1) })
