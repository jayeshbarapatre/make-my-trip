import { db } from '../config/firebase.js'
import { canonicalCity, cityMatches } from '../utils/cities.js'

/**
 * Indexed inventory search.
 *
 * Every vertical previously ran `db.collection(x).get()` and filtered the whole
 * collection in memory. That is 509 document reads for one train search, and
 * ~1,596 for a cross-vertical page — about 31 searches before the Firestore
 * free-tier daily quota is gone. It does not scale on any pricing tier.
 *
 * Firestore cannot do case-insensitive or substring matching, so a route filter
 * has to be an equality test against a value that is already normalised in the
 * document. `ROUTE_FIELD` names those denormalised fields; they are written by
 * the seeders and backfilled by `scripts/backfillRouteIndex.js`.
 *
 * Three equality filters (from + to + isActive) need no composite index —
 * Firestore merges the automatic single-field indexes. The result set for one
 * route is small (single digits to low tens), so sorting, secondary filtering
 * and pagination stay in memory, where they are free.
 */

/** Which denormalised fields each collection carries, and its legacy sources. */
const ROUTE_FIELD = {
  flights: { from: 'fromCanonical', to: 'toCanonical', legacyFrom: ['source', 'from'], legacyTo: ['destination', 'to'] },
  trains: { from: 'fromCanonical', to: 'toCanonical', legacyFrom: ['from', 'source'], legacyTo: ['to', 'destination'] },
  buses: { from: 'fromCanonical', to: 'toCanonical', legacyFrom: ['from', 'source'], legacyTo: ['to', 'destination'] },
  cabs: { from: 'fromCanonical', to: 'toCanonical', legacyFrom: ['from'], legacyTo: ['to'] },
  hotels: { city: 'cityCanonical', legacyCity: ['city', 'location'] }
}

/**
 * Marks a document as carrying the denormalised route fields. Search uses this
 * to decide, once per process, whether the indexed path is usable at all.
 */
export const ROUTE_INDEX_FLAG = 'routeIndexed'

export const routeFieldsFor = (collection) => ROUTE_FIELD[collection] ?? null

/** First truthy value among `keys` on `data`. */
const firstOf = (data, keys = []) => {
  for (const k of keys) {
    if (data?.[k]) return data[k]
  }
  return null
}

/**
 * Builds the denormalised fields for a document about to be written.
 * Seeders and admin/vendor create paths call this so new inventory is
 * searchable the moment it is stored.
 */
export const routeIndexFields = (collection, data) => {
  const spec = ROUTE_FIELD[collection]
  if (!spec) return {}

  if (spec.city) {
    const city = firstOf(data, spec.legacyCity)
    return city ? { [spec.city]: canonicalCity(city), [ROUTE_INDEX_FLAG]: true } : {}
  }

  const from = firstOf(data, spec.legacyFrom)
  const to = firstOf(data, spec.legacyTo)
  if (!from || !to) return {}

  return {
    [spec.from]: canonicalCity(from),
    [spec.to]: canonicalCity(to),
    [ROUTE_INDEX_FLAG]: true
  }
}

/**
 * How much of a collection carries the route index. Resolved once per process.
 *
 * `complete` matters as much as `indexed`. A collection is routinely PARTIALLY
 * indexed — `npm run seed:buses` wrote inventory without the canonical fields
 * while the admin/vendor create paths wrote it with them. Probing for a single
 * flagged document then concluding "the whole collection is indexed" made every
 * unflagged document invisible to search: the equality filter on `fromCanonical`
 * cannot match a document that has no `fromCanonical`. That is how a route with
 * real inventory returned "0 of 0".
 *
 * So: count both sides. Only a collection where every document is flagged can
 * trust the indexed query on its own; a partially indexed one keeps the scan as
 * a fallback for empty results.
 */
const indexState = new Map()

const resolveIndexState = async (collection) => {
  if (indexState.has(collection)) return indexState.get(collection)

  const ref = db.collection(collection)
  const [totalSnap, indexedSnap] = await Promise.all([
    ref.count().get().catch((e) => e),
    ref.where(ROUTE_INDEX_FLAG, '==', true).count().get().catch((e) => e)
  ])

  // A failed probe is not evidence about the data. Caching it would pin the
  // process to full scans for its entire lifetime after one transient error —
  // and on a read-quota failure the scan is exactly what cannot succeed.
  if (totalSnap instanceof Error || indexedSnap instanceof Error) {
    const cause = totalSnap instanceof Error ? totalSnap : indexedSnap
    console.warn(`⚠️  ${collection}: route-index probe failed (${cause.message.split('\n')[0]}) — not cached, will retry.`)
    return { indexed: false, complete: false }
  }

  const total = totalSnap.data().count
  const withIndex = indexedSnap.data().count
  const state = { indexed: withIndex > 0, complete: total > 0 && withIndex === total }

  indexState.set(collection, state)

  if (!state.indexed) {
    console.warn(
      `⚠️  ${collection}: route index missing on all ${total} document(s) — falling back to a full collection scan. ` +
      'Run `npm run migrate:route-index -- --apply` to enable indexed search.'
    )
  } else if (!state.complete) {
    console.warn(
      `⚠️  ${collection}: route index is PARTIAL (${withIndex}/${total}) — unindexed inventory is invisible to the ` +
      'indexed query, so empty results fall back to a scan. Run `npm run migrate:route-index -- --apply`.'
    )
  }

  return state
}

/** Test seam: forget the cached probe result. */
export const resetIndexReadiness = () => indexState.clear()

/**
 * Fetches the candidate set for a route.
 *
 * @returns {Promise<{docs: object[], indexed: boolean, read: number}>}
 *   `read` is the number of documents actually pulled, so callers (and tests)
 *   can assert that the scan is gone.
 */
export const fetchRouteCandidates = async (collection, { from, to, city, activeOnly = true } = {}) => {
  const spec = ROUTE_FIELD[collection]
  if (!spec) throw new Error(`No route index defined for collection "${collection}"`)

  const { indexed, complete } = await resolveIndexState(collection)

  // The unindexed path: read the collection and match canonically in memory.
  // Expensive, so it is only ever a fallback — but it is the only thing that can
  // see documents the route index does not cover.
  const scan = async () => {
    let query = db.collection(collection)
    const snap = await query.get()
    const docs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((d) => (activeOnly ? d.isActive !== false : true))
      .filter((d) => (spec.city
        ? cityMatches(d[spec.city] ?? firstOf(d, spec.legacyCity), city)
        : cityMatches(d[spec.from] ?? firstOf(d, spec.legacyFrom), from) &&
          cityMatches(d[spec.to] ?? firstOf(d, spec.legacyTo), to)))

    return { docs, indexed: false, read: snap.size }
  }

  if (!indexed) return scan()

  let query = db.collection(collection)

  if (spec.city) {
    const c = canonicalCity(city)
    if (c) query = query.where(spec.city, '==', c)
  } else {
    const f = canonicalCity(from)
    const t = canonicalCity(to)
    if (f) query = query.where(spec.from, '==', f)
    if (t) query = query.where(spec.to, '==', t)
  }

  // `isActive` is only safe to filter server-side on the indexed path: the
  // backfill makes the field explicit, whereas an un-migrated document may
  // simply not have it, and absent means active throughout this codebase.
  if (activeOnly) query = query.where('isActive', '==', true)

  const snap = await query.get()

  // An empty indexed result over a partially indexed collection proves nothing
  // about whether inventory exists — the matching documents may simply lack the
  // canonical fields. Confirm with a scan before telling the user there are no
  // buses. A fully indexed collection needs no such confirmation.
  if (snap.empty && !complete) {
    console.warn(`⚠️  ${collection}: indexed query returned 0 on a partially indexed collection — verifying with a scan.`)
    const fallback = await scan()
    return { ...fallback, read: fallback.read + snap.size }
  }

  return {
    docs: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    indexed: true,
    read: snap.size
  }
}

/**
 * Shared post-query pipeline: secondary filters, sort, paginate.
 *
 * Runs in memory deliberately. Once the route filter has been applied the
 * candidate set is small, and Firestore cannot express most of these
 * predicates (price windows combined with a sort, time-of-day buckets,
 * amenity contains) without a composite index per combination.
 */
export const applySearchPipeline = (docs, {
  filters = [],
  sortBy = null,
  page = 1,
  limit = 20
} = {}) => {
  let rows = docs
  for (const predicate of filters) {
    if (typeof predicate === 'function') rows = rows.filter(predicate)
  }

  if (typeof sortBy === 'function') rows = [...rows].sort(sortBy)

  const total = rows.length
  const pages = Math.max(1, Math.ceil(total / limit))
  const start = (page - 1) * limit

  return {
    rows: rows.slice(start, start + limit),
    pagination: { page, limit, total, pages }
  }
}

export default {
  fetchRouteCandidates,
  applySearchPipeline,
  routeIndexFields,
  routeFieldsFor,
  resetIndexReadiness,
  ROUTE_INDEX_FLAG
}
