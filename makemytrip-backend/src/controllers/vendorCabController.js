import { db } from '../config/firebase.js'
import { createVendorCrud, ListingStatus } from './factories/firestoreVendorCrud.js'
import { validateProfile, profileToStorage } from '../services/cabProfile.js'
import { CabStatus, expiredDocuments } from '../config/cabModel.js'
import { readinessProblems } from '../services/cabReadiness.js'

// Tenant scoping lives in the factory: every query is constrained to
// req.vendorId, which vendorAuth reads from the stored user document rather
// than from the request.
//
// Shape and rules live in services/cabProfile.js, shared with the admin
// controller so the two cannot accept different things — the previous version
// had the vendor form writing `currentCity` with no destination while search
// read `from`/`to`, which made every vendor-listed cab unfindable.

const crud = createVendorCrud({
  collection: 'cabs',
  label: 'Cab',
  listKey: 'cabs',
  uniqueField: 'vehicleNumber',
  validate: validateProfile,
  toStorage: profileToStorage
})

/**
 * §13, §40.2 — what a cab must have before an admin is asked to look at it.
 *
 * Checked here rather than at approval time so the vendor is told what is
 * missing while they are still in the form, instead of waiting for a rejection
 * that says the same thing hours later.
 */
export { readinessProblems }

/**
 * Wraps the factory's submit so an incomplete cab never reaches the approval
 * queue. The factory handles the status transition and the admin notification;
 * this only decides whether it should run at all.
 */
export const submitCabForApproval = async (req, res) => {
  try {
    const found = await crud.loadOwned(req)
    if (!found) return res.status(404).json({ success: false, message: 'Cab not found' })

    const { blocking, advisory } = readinessProblems(found.data)

    if (blocking.length) {
      return res.status(400).json({
        success: false,
        code: 'CAB_INCOMPLETE',
        message: 'This cab is not ready for approval yet.',
        problems: blocking
      })
    }

    // Recorded on the cab so the admin reviewing it sees what the vendor was
    // warned about, rather than having to work it out from the document list.
    if (advisory.length) {
      await found.ref.update({ readinessWarnings: advisory }).catch(() => {})
    }

    return crud.submitForApproval(req, res)
  } catch (err) {
    console.error('Submit cab error:', err.message)
    return res.status(500).json({ success: false, message: 'Could not submit this cab for approval' })
  }
}

/**
 * §2 — the counters on the vendor's Cab Management dashboard.
 *
 * Reads the collection directly rather than adding a helper to the shared
 * vendor factory: hotels and buses use that factory too, and a counter only
 * cabs need is not worth the blast radius.
 */
export const getCabStats = async (req, res) => {
  try {
    const snap = await db.collection('cabs').where('vendorId', '==', req.vendorId).get()
    const listed = snap.docs.map((d) => d.data()).filter((c) => !c.isDeleted)

    const byStatus = (status) => listed.filter((c) => (c.listingStatus ?? ListingStatus.DRAFT) === status).length

    res.json({
      success: true,
      data: {
        total: listed.length,
        draft: byStatus(CabStatus.DRAFT),
        pendingApproval: byStatus(CabStatus.PENDING_APPROVAL),
        approved: byStatus(CabStatus.APPROVED),
        rejected: byStatus(CabStatus.REJECTED),
        suspended: byStatus(CabStatus.SUSPENDED),
        active: listed.filter((c) => c.isActive !== false &&
          [CabStatus.APPROVED, CabStatus.ACTIVE].includes(c.listingStatus ?? CabStatus.APPROVED)).length,
        documentsExpiring: listed.filter((c) => expiredDocuments(c).length > 0).length
      }
    })
  } catch (err) {
    console.error('Cab stats error:', err.message)
    res.status(500).json({ success: false, message: 'Could not load cab statistics' })
  }
}

export const getMyCabs = crud.list
export const createCab = crud.create
export const getMyCabById = crud.getById
export const updateCab = crud.update
export const deleteCab = crud.remove
export const toggleCabStatus = crud.toggleStatus
