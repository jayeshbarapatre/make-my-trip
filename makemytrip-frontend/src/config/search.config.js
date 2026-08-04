/**
 * How many inventory rows a results page requests.
 *
 * The backend defaults to 20. Every results page then filters and sorts that
 * page in the browser, so "cheapest first" only ever sorted the first 20 rows
 * the server happened to return — on a route with 40 options the genuinely
 * cheapest one could not be shown, and the result count was wrong.
 *
 * A route search is naturally small: one city pair returns tens of options, not
 * thousands. Asking for the whole route in one request makes the client-side
 * filters and sorts correct by construction, and keeps them instant, because
 * they operate on the complete set rather than a window of it.
 *
 * This is only safe because search is now an indexed route query. While search
 * scanned entire collections, a higher limit would have made the read cost
 * worse; it now bounds the response, not the scan.
 *
 * Kept at the API's own ceiling (`validatePageSize` caps at 100) so a request
 * can never silently come back truncated.
 */
export const RESULTS_PER_REQUEST = 100

/**
 * Sort keys the search API understands. Every vertical accepts `price` and
 * `price_desc`; the rest vary, so pages pass only what they offer.
 */
export const SORT_KEYS = {
  CHEAPEST: 'price',
  MOST_EXPENSIVE: 'price_desc',
  DURATION: 'duration',
  DEPARTURE: 'departure',
  RATING: 'rating'
}

export default { RESULTS_PER_REQUEST, SORT_KEYS }
