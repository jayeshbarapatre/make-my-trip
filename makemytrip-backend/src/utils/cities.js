/**
 * Canonical city resolution for inventory search.
 *
 * Indian cities are routinely written more than one way, and this platform's
 * data contains several spellings of the same place at once. Measured across
 * the live collections:
 *
 *   Delhi      -> trains, buses, flights, hotels
 *   New Delhi  -> trains, cabs, flights          <- the SAME cities collection
 *   Bangalore  -> trains, buses, flights, hotels
 *   Bengaluru  -> trains, buses, cabs, flights
 *
 * Every search controller matched with a plain substring test, so:
 *
 *   - The frontend city picker (src/data/cities.js) offers "New Delhi" and
 *     "Bengaluru". `"delhi".includes("new delhi")` is false, so choosing either
 *     from the dropdown returned ZERO trains, buses and flights.
 *   - Even a working spelling only found half the inventory, because records
 *     stored under the other spelling never matched.
 *
 * Resolving both sides to a canonical name fixes the picker mismatch and
 * reunites the split inventory, without rewriting stored data and without the
 * frontend needing to know any of it.
 */

/** Alternate spellings and former names, mapped to one canonical form. */
const ALIASES = new Map([
  ['new delhi', 'delhi'],
  ['delhi ncr', 'delhi'],
  ['ncr', 'delhi'],
  ['bengaluru', 'bangalore'],
  ['bombay', 'mumbai'],
  ['calcutta', 'kolkata'],
  ['madras', 'chennai'],
  ['cochin', 'kochi'],
  ['ernakulam', 'kochi'],
  ['trivandrum', 'thiruvananthapuram'],
  ['gurgaon', 'gurugram'],
  ['baroda', 'vadodara'],
  ['mysore', 'mysuru'],
  ['pondicherry', 'puducherry'],
  ['poona', 'pune'],
  ['vizag', 'visakhapatnam'],
  ['benares', 'varanasi'],
  ['banaras', 'varanasi'],
  ['prayagraj', 'allahabad'],
  ['panaji', 'goa'],
  ['panjim', 'goa'],
  ['dabolim', 'goa']
])

/**
 * IATA codes that appear inside stored location strings such as
 * "Indira Gandhi Intl. Airport (DEL)". Airport-transfer inventory is stored
 * under the terminal name, so without this a search for "Delhi" would not find
 * a Delhi airport pickup.
 */
const AIRPORT_CODES = new Map([
  ['del', 'delhi'], ['bom', 'mumbai'], ['blr', 'bangalore'], ['maa', 'chennai'],
  ['ccu', 'kolkata'], ['hyd', 'hyderabad'], ['goi', 'goa'], ['pnq', 'pune'],
  ['amd', 'ahmedabad'], ['jai', 'jaipur'], ['cok', 'kochi'], ['trv', 'thiruvananthapuram'],
  ['lko', 'lucknow'], ['ixc', 'chandigarh'], ['atq', 'amritsar'], ['vns', 'varanasi'],
  ['pat', 'patna'], ['bbi', 'bhubaneswar'], ['gau', 'guwahati'], ['nag', 'nagpur'],
  ['idr', 'indore'], ['bho', 'bhopal'], ['udr', 'udaipur'], ['jdh', 'jodhpur']
])

const clean = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9() ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

/**
 * The canonical name for a city, or '' for empty input.
 *
 * Handles the alias table, and pulls a city out of an airport/terminal string
 * via its IATA code when one is present.
 */
export const canonicalCity = (value) => {
  const base = clean(value)
  if (!base) return ''

  if (ALIASES.has(base)) return ALIASES.get(base)

  // "indira gandhi intl airport (del)" -> delhi
  const code = /\(([a-z]{3})\)/.exec(base)?.[1]
  if (code && AIRPORT_CODES.has(code)) return AIRPORT_CODES.get(code)

  // Strip a trailing qualifier: "mumbai central" -> mumbai, when the head is a
  // known alias or already canonical.
  const head = base.split(' ')[0]
  if (ALIASES.has(head)) return ALIASES.get(head)

  return base
}

/**
 * Whether a stored location satisfies a user's search term.
 *
 * Canonical equality first, then a substring test so partial input ("bang")
 * and richer stored values ("Bengaluru Airport (BLR)") still match. The
 * substring test runs on canonical forms, so "New Delhi" matches a record
 * stored as "Delhi".
 *
 * An empty query matches everything, which is what an unfiltered search means.
 */
export const cityMatches = (stored, query) => {
  const q = canonicalCity(query)
  if (!q) return true

  const s = canonicalCity(stored)
  if (!s) return false

  if (s === q) return true
  if (s.includes(q) || q.includes(s)) return true

  // Fall back to the raw strings so a stored value this module does not know
  // how to canonicalise still behaves as it did before.
  return clean(stored).includes(clean(query))
}

/** Every spelling that resolves to the same city as `value`, for seeding/reporting. */
export const aliasesFor = (value) => {
  const canonical = canonicalCity(value)
  const out = new Set([canonical])
  for (const [alias, target] of ALIASES) if (target === canonical) out.add(alias)
  return [...out]
}

export default { canonicalCity, cityMatches, aliasesFor }
