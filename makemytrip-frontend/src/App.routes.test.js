import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * React Router ranks routes by pattern, and a parameter's *name* is not part of
 * that pattern. Two declarations were therefore dead:
 *
 *   /flights/results  -> SearchResultsPage   (won)
 *   /flights/results  -> FlightResultsPage   (never rendered)
 *   /booking/:flightId  -> BookingPage           (won)
 *   /booking/:bookingId -> BookingDetailsPage    (never rendered)
 *
 * Neither showed up as an error. The page simply rendered the wrong component,
 * which is exactly the kind of defect that survives manual testing.
 */
const APP = resolve(process.cwd(), 'src', 'App.jsx')
const src = readFileSync(APP, 'utf8')

const paths = [...src.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1])
const normalise = (p) => p.replace(/:[A-Za-z0-9_]+/g, ':param')

describe('route table', () => {
  it('declares at least the main verticals', () => {
    expect(paths.length).toBeGreaterThan(20)
  })

  it('has no two routes with the same pattern', () => {
    const seen = new Map()
    const clashes = []
    for (const p of paths) {
      const key = normalise(p)
      if (seen.has(key)) clashes.push(`${seen.get(key)} and ${p} both match ${key}`)
      else seen.set(key, p)
    }
    expect(clashes).toEqual([])
  })

  it('routes every promotion id to a page that exists', async () => {
    const { OFFERS, PICKS } = await import('./data/offersData.js')
    const all = [...OFFERS, ...PICKS]
    expect(all.length).toBeGreaterThan(0)

    const ids = all.map((p) => p.id)
    expect(new Set(ids).size, 'promotion ids must be unique — they are URLs').toBe(ids.length)

    expect(paths.map(normalise)).toContain('/offers/:param')
  })

  it('points every promotion action at a declared route', async () => {
    const { OFFERS, PICKS } = await import('./data/offersData.js')
    const declared = paths.map(normalise)

    const resolves = (to) => {
      const base = to.split('?')[0]
      return declared.some((r) =>
        r === base || (r.includes(':param') && new RegExp(`^${r.replace(/:param/g, '[^/]+')}$`).test(base))
      )
    }

    const dead = [...OFFERS, ...PICKS]
      .filter((p) => !resolves(p.action.to))
      .map((p) => `${p.id} -> ${p.action.to}`)

    expect(dead).toEqual([])
  })
})
