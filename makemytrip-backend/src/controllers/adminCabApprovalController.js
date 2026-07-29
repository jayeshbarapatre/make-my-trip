import { createApprovalController } from './factories/firestoreApproval.js'

// Migrated from Prisma/MongoDB to Firestore. Queue behaviour and the
// PENDING_APPROVAL guard live in the shared factory.

const approval = createApprovalController({ collection: 'cabs', label: 'Cab', listKey: 'cabs' })

export const getPendingCabs = approval.listPending
export const approveCab = approval.approve
export const rejectCab = approval.reject
