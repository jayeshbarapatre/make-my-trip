import { createApprovalController } from './factories/firestoreApproval.js'

// Migrated from Prisma/MongoDB to Firestore. Queue behaviour and the
// PENDING_APPROVAL guard live in the shared factory.

const approval = createApprovalController({ collection: 'hotels', label: 'Hotel', listKey: 'hotels' })

export const getPendingHotels = approval.listPending
export const approveHotel = approval.approve
export const rejectHotel = approval.reject
