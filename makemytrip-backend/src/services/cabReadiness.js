/**
 * Whether a cab is complete enough to be sent for approval (§13, §40.2).
 *
 * Split from the controller so it can be tested without a datastore, and so
 * the vendor form, the submit endpoint and the admin review screen all judge
 * "ready" the same way.
 *
 * Two lists, deliberately. `blocking` refuses the submission; `advisory` is
 * recorded on the cab and shown to the reviewing admin. The distinction exists
 * because a requirement the vendor has no way to satisfy is not a requirement,
 * it is a trap — see `UPLOADS_AVAILABLE`.
 */

import {
  missingMandatoryDocuments, expiredDocuments, sellableServiceTypes
} from '../config/cabModel.js'

/**
 * Documents and photos are required by §13, but there is no upload screen yet:
 * the multi-step form that collects them is still being built. Until it ships,
 * blocking on them would leave a vendor unable to submit any cab at all, so
 * they are reported to the admin instead of refused.
 *
 * Flip this to `true` in the same change that ships the upload steps.
 * `cabReadiness.test.mjs` pins the behaviour at both settings, so the flip is a
 * checked change rather than a hope.
 */
export const UPLOADS_AVAILABLE = false

export const readinessProblems = (cab, { uploadsAvailable = UPLOADS_AVAILABLE } = {}) => {
  const blocking = []
  const advisory = []
  const uploadIssue = (text) => (uploadsAvailable ? blocking : advisory).push(text)

  const missingDocs = missingMandatoryDocuments(cab)
  if (missingDocs.length) {
    uploadIssue(`Upload the ${missingDocs.join(', ')} document${missingDocs.length > 1 ? 's' : ''}`)
  }

  if (!(cab?.images?.length ?? 0)) {
    uploadIssue('Upload at least one vehicle photo')
  }

  // Always blocking, whatever the upload state. This is not a missing file —
  // it is a vehicle that is not road-legal today, and §40.11 says such a cab
  // must not take bookings.
  const expired = expiredDocuments(cab)
  if (expired.length) {
    blocking.push(`These documents have expired: ${expired.map((d) => d.type).join(', ')}`)
  }

  // The rest are satisfiable in the form as it stands, so they block.
  const declared = Array.isArray(cab?.serviceTypes) ? cab.serviceTypes : []
  if (declared.length) {
    const sellable = sellableServiceTypes(cab)
    const unpriced = declared.filter((t) => !sellable.includes(t))
    if (unpriced.length) blocking.push(`Add pricing for: ${unpriced.join(', ')}`)
  }

  const hasRoute = (cab?.routes?.length ?? 0) > 0 || (cab?.from && cab?.to)
  if (!hasRoute) {
    blocking.push('Add at least one route the cab serves — a cab with no destination cannot be found in search')
  }

  return { blocking, advisory }
}

export default { readinessProblems, UPLOADS_AVAILABLE }
