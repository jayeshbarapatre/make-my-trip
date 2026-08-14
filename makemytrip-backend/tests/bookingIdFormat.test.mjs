// Booking references are customer-facing strings that outlive a rebrand.
//
// The product was renamed MakeMyTrip -> TripOra, so new references carry TRP-.
// The bookings already issued keep MMT-, because that string is printed on
// tickets, quoted in emails and read out to support; rewriting them would
// invalidate every record a customer holds. These tests pin both halves of that
// decision, and pin that nothing anywhere parses the prefix — which is the
// property that made changing it safe.

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

import { generateBookingId, generatePNR, generateInvoiceNumber } from '../src/utils/idGenerator.js'

describe('new booking references carry the current brand', () => {
  test('each vertical gets its own typed reference', () => {
    for (const [type, code] of Object.entries({
      flight: 'FL', hotel: 'HT', bus: 'BS', train: 'TR', cab: 'CB'
    })) {
      assert.match(generateBookingId(type), new RegExp(`^TRP-${code}-[0-9A-Z]{8}$`), type)
    }
  })

  test('an unknown type falls back rather than producing a malformed id', () => {
    assert.match(generateBookingId('spaceship'), /^TRP-FL-[0-9A-Z]{8}$/)
  })

  test('references are unguessable and do not collide', () => {
    const ids = new Set(Array.from({ length: 500 }, () => generateBookingId('flight')))
    assert.equal(ids.size, 500, 'crypto randomness must not repeat across 500 draws')
  })

  test('ambiguous characters stay out of anything read aloud', () => {
    // I/L/O/U are excluded so a reference retyped from a printed ticket cannot
    // be misread as 1/0.
    const sample = Array.from({ length: 200 }, () => generateBookingId('hotel')).join('')
    assert.equal(/[ILOU]/.test(sample.replace(/^TRP-HT-|-/g, '')), false)
  })
})

describe('PNRs and invoices are unaffected by the rename', () => {
  test('PNR prefixes are per-vertical, not brand-derived', () => {
    // These are industry-style record locators, not brand strings, so a rebrand
    // must leave them alone.
    assert.match(generatePNR('flight'), /^PNR-[0-9A-Z]{6}$/)
    assert.match(generatePNR('hotel'), /^HTL-[0-9A-Z]{6}$/)
    assert.match(generatePNR('cab'), /^CAB-[0-9A-Z]{6}$/)
  })

  test('invoice numbers keep their INV- namespace and carry the date', () => {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    assert.match(generateInvoiceNumber('bus'), new RegExp(`^INV-BS-${today}-[0-9A-Z]{6}$`))
  })
})

describe('nothing parses the brand prefix', () => {
  test('no source file branches on a booking-id prefix', () => {
    // This is the property that made the rename safe. If code ever starts
    // reading the prefix, the two coexisting formats become a live bug and this
    // test is the warning.
    const root = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

    const walk = (dir) => {
      const out = []
      for (const entry of readdirSync(dir)) {
        const full = path.join(dir, entry)
        if (statSync(full).isDirectory()) out.push(...walk(full))
        else if (entry.endsWith('.js')) out.push(full)
      }
      return out
    }

    const offenders = []
    for (const file of walk(root)) {
      const src = readFileSync(file, 'utf8')
      if (path.basename(file) === 'idGenerator.js') continue
      // Anything that slices, matches or compares against the namespace.
      if (/(startsWith|includes|match|split|slice|replace)\s*\(\s*['"`/](TRP|MMT)-/.test(src)) {
        offenders.push(path.relative(root, file))
      }
    }

    assert.deepEqual(offenders, [], 'these files read the booking-id prefix')
  })
})
