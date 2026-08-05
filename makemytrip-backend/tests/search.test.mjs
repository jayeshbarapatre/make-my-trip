// Loaded before any src/ import: firebase.js reads its credentials at module
// scope, so without this the suite dies on import rather than on assertion.
import 'dotenv/config'

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

import { canonicalCity, cityMatches, aliasesFor } from '../src/utils/cities.js'
import { routeIndexFields, applySearchPipeline, ROUTE_INDEX_FLAG } from '../src/services/inventorySearch.js'

// Search correctness and cost. Two defects are pinned here:
//
//   1. The city picker sends "New Delhi" and "Bengaluru" while inventory stores
//      "Delhi" and "Bangalore". Substring matching made that return zero, and
//      inventory was split across both spellings inside the same collection.
//
//   2. Every search pulled its whole collection and filtered in memory — 509
//      reads for one train search, ~1,596 for a cross-vertical page, roughly 31
//      searches before the Firestore free-tier daily quota was gone.

describe('city resolution', () => {
  test('the city picker values resolve to stored inventory spellings', () => {
    // These exact strings come from makemytrip-frontend/src/data/cities.js.
    assert.equal(canonicalCity('New Delhi'), canonicalCity('Delhi'))
    assert.equal(canonicalCity('Bengaluru'), canonicalCity('Bangalore'))
  })

  test('former and alternate names resolve', () => {
    const same = [
      ['Bombay', 'Mumbai'], ['Calcutta', 'Kolkata'], ['Madras', 'Chennai'],
      ['Cochin', 'Kochi'], ['Trivandrum', 'Thiruvananthapuram'],
      ['Gurgaon', 'Gurugram'], ['Baroda', 'Vadodara'], ['Mysore', 'Mysuru'],
      ['Pondicherry', 'Puducherry'], ['Vizag', 'Visakhapatnam']
    ]
    for (const [a, b] of same) {
      assert.equal(canonicalCity(a), canonicalCity(b), `${a} should resolve to ${b}`)
    }
  })

  test('distinct cities do not collide', () => {
    const distinct = ['Mumbai', 'Delhi', 'Chennai', 'Kolkata', 'Jaipur', 'Goa', 'Pune', 'Agra']
    const canonical = distinct.map(canonicalCity)
    assert.equal(new Set(canonical).size, distinct.length, 'every city must stay distinct')
  })

  test('airport terminals resolve to their city by IATA code', () => {
    assert.equal(canonicalCity('Indira Gandhi Intl. Airport (DEL)'), 'delhi')
    assert.equal(canonicalCity('Bengaluru Airport (BLR)'), 'bangalore')
    assert.equal(canonicalCity('Chhatrapati Shivaji Intl. Airport (BOM)'), 'mumbai')
  })

  test('cityMatches is symmetric across spellings', () => {
    assert.ok(cityMatches('Delhi', 'New Delhi'))
    assert.ok(cityMatches('New Delhi', 'Delhi'))
    assert.ok(cityMatches('Bangalore', 'Bengaluru'))
    assert.ok(cityMatches('Bengaluru', 'Bangalore'))
  })

  test('cityMatches rejects unrelated cities', () => {
    assert.ok(!cityMatches('Mumbai', 'Delhi'))
    assert.ok(!cityMatches('Chennai', 'Kolkata'))
  })

  test('an empty query matches everything, an empty record matches nothing', () => {
    assert.ok(cityMatches('Delhi', ''))
    assert.ok(cityMatches('Delhi', null))
    assert.ok(!cityMatches('', 'Delhi'))
    assert.ok(!cityMatches(null, 'Delhi'))
  })

  test('aliasesFor reports every spelling of a city', () => {
    const delhi = aliasesFor('Delhi')
    assert.ok(delhi.includes('delhi'))
    assert.ok(delhi.includes('new delhi'))
  })
})

describe('route index fields', () => {
  test('transport documents get canonical from/to and the ready flag', () => {
    const fields = routeIndexFields('trains', { from: 'New Delhi', to: 'Bengaluru' })
    assert.equal(fields.fromCanonical, 'delhi')
    assert.equal(fields.toCanonical, 'bangalore')
    assert.equal(fields[ROUTE_INDEX_FLAG], true)
  })

  test('flights map their source/destination schema', () => {
    const fields = routeIndexFields('flights', { source: 'Bombay', destination: 'Madras' })
    assert.equal(fields.fromCanonical, 'mumbai')
    assert.equal(fields.toCanonical, 'chennai')
  })

  test('hotels get a canonical city', () => {
    const fields = routeIndexFields('hotels', { city: 'Bengaluru' })
    assert.equal(fields.cityCanonical, 'bangalore')
    assert.equal(fields[ROUTE_INDEX_FLAG], true)
  })

  test('a document with no route yields no fields rather than empty ones', () => {
    // Writing fromCanonical:'' would make the document match an empty query.
    assert.deepEqual(routeIndexFields('trains', { from: 'Delhi' }), {})
    assert.deepEqual(routeIndexFields('hotels', {}), {})
  })
})

describe('search pipeline', () => {
  const rows = Array.from({ length: 25 }, (_, i) => ({ id: `r${i}`, price: 100 + i * 10, seats: i }))

  test('filters compose', () => {
    const { rows: out } = applySearchPipeline(rows, {
      filters: [(r) => r.price >= 150, (r) => r.price <= 250],
      limit: 50
    })
    assert.ok(out.every((r) => r.price >= 150 && r.price <= 250))
  })

  test('sorting is applied without mutating the input', () => {
    const before = rows.map((r) => r.id)
    applySearchPipeline(rows, { sortBy: (a, b) => b.price - a.price, limit: 50 })
    assert.deepEqual(rows.map((r) => r.id), before, 'the caller\'s array must not be reordered')
  })

  test('pagination partitions without loss or overlap', () => {
    const size = 7
    const seen = []
    const pages = Math.ceil(rows.length / size)

    for (let p = 1; p <= pages; p++) {
      const { rows: page, pagination } = applySearchPipeline(rows, { page: p, limit: size })
      assert.equal(pagination.total, rows.length)
      assert.equal(pagination.pages, pages)
      seen.push(...page.map((r) => r.id))
    }

    assert.equal(new Set(seen).size, rows.length, 'every row appears exactly once')
  })

  test('a page past the end is empty, not an error', () => {
    const { rows: out, pagination } = applySearchPipeline(rows, { page: 99, limit: 10 })
    assert.deepEqual(out, [])
    assert.equal(pagination.total, rows.length)
  })

  test('an empty candidate set reports one page, not zero', () => {
    const { pagination } = applySearchPipeline([], { page: 1, limit: 10 })
    assert.equal(pagination.total, 0)
    assert.equal(pagination.pages, 1)
  })
})

describe('search does not scan whole collections', () => {
  // The regression this guards against is a cost regression, which no
  // functional assertion would catch: the results would still be correct, just
  // ruinously expensive.

  const CONTROLLERS = [
    'firebaseFlightController.js',
    'firebaseTrainController.js',
    'firebaseBusController.js',
    'firebaseCabController.js',
    'firebaseHotelController.js'
  ]

  test('no search controller reads its collection unfiltered', async () => {
    const offenders = []

    for (const file of CONTROLLERS) {
      const src = await readFile(new URL(`../src/controllers/${file}`, import.meta.url), 'utf8')

      // The search handler only — details/availability handlers legitimately
      // fetch a single document by id.
      const start = src.search(/export const search\w+/)
      if (start === -1) continue
      const end = src.indexOf('\nexport const', start + 10)
      const body = src.slice(start, end === -1 ? undefined : end)

      // `.collection(x).get()` with nothing between is a full scan.
      if (/\.collection\(['"][a-z_]+['"]\)\s*\.get\(\)/.test(body)) {
        offenders.push(`${file}: unfiltered .get()`)
      }
    }

    assert.deepEqual(offenders, [], 'these search handlers still scan the whole collection')
  })

  test('every search controller routes through the shared indexed service', async () => {
    for (const file of CONTROLLERS) {
      const src = await readFile(new URL(`../src/controllers/${file}`, import.meta.url), 'utf8')
      assert.match(src, /fetchRouteCandidates/, `${file} must use the indexed search service`)
    }
  })

  test('inventory write paths denormalise the route so new records are searchable', async () => {
    for (const file of ['factories/firestoreAdminCrud.js', 'factories/firestoreVendorCrud.js']) {
      const src = await readFile(new URL(`../src/controllers/${file}`, import.meta.url), 'utf8')
      assert.match(src, /routeIndexFields/, `${file} must write the canonical route fields`)
    }
  })
})

describe('page size is consistent across verticals', () => {
  // Flights capped at 50 while every other vertical allowed 100, so a results
  // page requesting a whole route got a silently truncated one for flights and
  // a complete one for everything else.

  const CONTROLLERS = [
    'firebaseFlightController.js',
    'firebaseTrainController.js',
    'firebaseBusController.js',
    'firebaseCabController.js',
    'firebaseHotelController.js'
  ]

  test('no controller hand-rolls its own page-size ceiling', async () => {
    const offenders = []
    for (const file of CONTROLLERS) {
      const src = await readFile(new URL(`../src/controllers/${file}`, import.meta.url), 'utf8')
      if (/Math\.min\(\s*\d+\s*,\s*parseInt\(limit\)/.test(src)) offenders.push(file)
    }
    assert.deepEqual(offenders, [], 'these bypass the shared validatePageSize ceiling')
  })

  test('every search controller uses the shared validators', async () => {
    for (const file of CONTROLLERS) {
      const src = await readFile(new URL(`../src/controllers/${file}`, import.meta.url), 'utf8')
      assert.match(src, /validatePageSize/, `${file} must use validatePageSize`)
    }
  })

  test('the frontend asks for no more than the API allows', async () => {
    const { validatePageSize } = await import('../src/utils/validation.js')
    const cfg = await readFile(new URL('../../makemytrip-frontend/src/config/search.config.js', import.meta.url), 'utf8')

    const requested = Number(/RESULTS_PER_REQUEST\s*=\s*(\d+)/.exec(cfg)?.[1])
    assert.ok(Number.isFinite(requested), 'RESULTS_PER_REQUEST must be a number')
    assert.equal(
      validatePageSize(requested), requested,
      `the frontend asks for ${requested} but the API would clamp it to ${validatePageSize(requested)}`
    )
  })

  test('every results page requests the full route', async () => {
    // Client-side filtering and sorting is only correct over the whole route.
    const pages = [
      'SearchResultsPage.jsx', 'HotelListingPage.jsx', 'TrainResultsPage.jsx',
      'BusSearchResultsPage.jsx', 'CabSearchResultsPage.jsx'
    ]
    for (const page of pages) {
      const src = await readFile(new URL(`../../makemytrip-frontend/src/pages/${page}`, import.meta.url), 'utf8')
      assert.match(src, /RESULTS_PER_REQUEST/, `${page} must request the full route, not the default page`)
    }
  })
})

describe('availability filters reach the API', () => {
  // `passengers` and `rooms` are not display filters — the server uses them to
  // drop inventory that cannot seat the party. Every results page held the
  // count and none forwarded it, so a 4-passenger search listed trains with one
  // seat left; the customer picked one and the booking failed.

  const PAGES = [
    { file: 'SearchResultsPage.jsx', param: 'passengers' },
    { file: 'TrainResultsPage.jsx', param: 'passengers' },
    { file: 'BusSearchResultsPage.jsx', param: 'passengers' },
    { file: 'HotelListingPage.jsx', param: 'rooms' }
  ]

  for (const { file, param } of PAGES) {
    test(`${file} forwards ${param} to search`, async () => {
      const src = await readFile(
        new URL(`../../makemytrip-frontend/src/pages/${file}`, import.meta.url), 'utf8'
      )

      // Look inside the search invocation, not anywhere in the file — the count
      // existed as local state in every one of these before the fix.
      const call = /(?:Service\.search|searchHotels)\s*\(\{[\s\S]{0,600}?\}\)/.exec(src)
      assert.ok(call, `${file}: could not locate the search call`)
      assert.ok(call[0].includes(param),
        `${file} must send ${param} or it will list unbookable inventory`)
    })
  }

  test('the backend actually applies the availability filter', async () => {
    const { applySearchPipeline } = await import('../src/services/inventorySearch.js')
    const rows = [
      { id: 'a', seatsAvailable: 1 },
      { id: 'b', seatsAvailable: 6 },
      { id: 'c', seatsAvailable: 0 }
    ]
    const { rows: out } = applySearchPipeline(rows, {
      filters: [(r) => (r.seatsAvailable ?? 0) >= 4],
      limit: 50
    })
    assert.deepEqual(out.map((r) => r.id), ['b'], 'only inventory that seats the party may be shown')
  })
})

describe('checkout pages never fabricate inventory', () => {
  // Router state is discarded by a refresh or a deep link. Four checkout pages
  // responded by inventing a listing — `id: "hotel-fallback"`, "Axiom Resort
  // Luxury Cottages" at ₹5,000, hardcoded 2026-05-15 dates, a made-up cab and
  // driver. The server's pricing guard rejected the unknown ids, so the
  // customer saw a real-looking booking they never chose, with a quote that
  // could never succeed and no way forward. HotelReviewPage was worse: it runs
  // before payment, so the fake hotel and wrong dates were carried forward.

  const PAGES = [
    'HotelReviewPage.jsx',
    'HotelPaymentPage.jsx',
    'CabPaymentPage.jsx',
    'TrainPaymentPage.jsx',
    'FlightPaymentPage.jsx'
  ]

  const readPage = (name) =>
    readFile(new URL(`../../makemytrip-frontend/src/pages/${name}`, import.meta.url), 'utf8')

  // Comments describing the removed behaviour are fine; code is not.
  const codeOf = (src) =>
    src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n')

  test('no checkout page invents a listing id', async () => {
    for (const page of PAGES) {
      const code = codeOf(await readPage(page))
      assert.ok(!/-fallback["']/.test(code), `${page} fabricates a listing id`)
    }
  })

  test('no checkout page hardcodes travel dates', async () => {
    // A hardcoded check-in silently became the booked date.
    for (const page of PAGES) {
      const code = codeOf(await readPage(page))
      assert.ok(!/\|\|\s*["']20\d{2}-\d{2}-\d{2}["']/.test(code), `${page} hardcodes a travel date`)
    }
  })

  test('every checkout page redirects when its state is missing', async () => {
    for (const page of PAGES) {
      const code = codeOf(await readPage(page))
      assert.match(code, /navigate\(\s*['"]\/(hotels|cabs|trains|flights|buses)['"]/,
        `${page} must send the customer back to choose rather than proceed with nothing`)
    }
  })

  test('every checkout page guards its render', async () => {
    // The redirect runs in an effect, so the first render still happens with no
    // state. TrainPaymentPage dereferenced train.name and threw.
    //
    // `return null` used to be accepted here. It is not any more: it paints a
    // blank white page, which a customer cannot tell apart from a crash or a
    // hung request, and the effect-based redirect does not always fire — a
    // deep-linked /cab/payment sat blank indefinitely. A checkout page must
    // render something that explains what happened and offers a way back,
    // either <CheckoutStateLost /> or its own inline recovery block.
    for (const page of PAGES) {
      const code = codeOf(await readPage(page))
      const recovers =
        /return\s*<CheckoutStateLost/.test(code) ||
        /if \(!\w+\?\.id[^)]*\)\s*\{\s*return \(/.test(code)

      assert.ok(recovers, `${page} must render a recovery screen, not a blank page, when state is missing`)
      assert.ok(!/\breturn null\b/.test(code), `${page} still bails out with a blank render`)
    }
  })
})

describe('the customer never sees a browser dialog or a simulated payment', () => {
  // Two failure modes lived in the customer-facing UI.
  //
  // `alert()` — 24 of them, against a project convention that says to use the
  // toast system. Most were validation ("Return date cannot be earlier than
  // departure date"), but sixteen were placeholder CTAs on verticals with no
  // backend: `alert('Initiating secure forex purchase flow!')` fired from a
  // button sitting under real-looking prices.
  //
  // Worse, MyTrips carried a Razorpay-branded modal whose "Simulate UPI / Card
  // Payment" button told the customer "Payment verified successfully! Your trip
  // upgrade is fully confirmed." No payment, no booking, no email. It called
  // create-order with a bare amount, which the server rejects outright.

  const SRC = new URL('../../makemytrip-frontend/src/', import.meta.url)

  const walk = async (dir) => {
    const { readdir } = await import('node:fs/promises')
    const out = []
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dir)
      if (entry.isDirectory()) out.push(...await walk(child))
      else if (/\.jsx?$/.test(entry.name)) out.push(child)
    }
    return out
  }

  // Comments describing the removed behaviour are fine; code is not.
  const codeOf = (src) =>
    src.split('\n').filter((l) => !l.trim().startsWith('//') && !l.trim().startsWith('*')).join('\n')

  test('no source file calls alert()', async () => {
    const offenders = []
    for (const file of await walk(SRC)) {
      const code = codeOf(await readFile(file, 'utf8'))
      // `window.alert` and a bare `alert(` both count; `.alert(` on an object
      // (e.g. a library instance) does not.
      if (/(?<![.\w])alert\s*\(/.test(code) || /window\.alert\s*\(/.test(code)) {
        offenders.push(file.pathname.split('/src/')[1])
      }
    }
    assert.deepEqual(offenders, [], 'these files still use a browser dialog instead of the toast system')
  })

  test('nothing simulates a payment or fakes a verification', async () => {
    const offenders = []
    for (const file of await walk(SRC)) {
      const code = codeOf(await readFile(file, 'utf8'))
      if (/Simulate\s+(UPI|Card|Payment)/i.test(code)) offenders.push(file.pathname.split('/src/')[1])
      if (/setPaymentSuccess\(true\)/.test(code)) offenders.push(file.pathname.split('/src/')[1])
    }
    assert.deepEqual(offenders, [], 'a payment may only be confirmed by the gateway, never by a button')
  })

  test('a vertical with no backend says so instead of pretending', async () => {
    // These render a full storefront. If one is still reachable it must carry
    // the coming-soon banner, so a customer is never walked to a dead purchase.
    const GATED = [
      'CruisePage.jsx', 'ForexPage.jsx', 'VisaPage.jsx', 'InsurancePage.jsx',
      'ToursPage.jsx', 'HomestaysPage.jsx', 'HolidaysPage.jsx'
    ]

    for (const page of GATED) {
      const code = await readFile(new URL(`pages/${page}`, SRC), 'utf8')
      assert.match(code, /<ComingSoon\b/, `${page} must tell the customer it is not bookable yet`)
    }
  })
})
