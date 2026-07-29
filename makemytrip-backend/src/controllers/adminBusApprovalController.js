import { createApprovalController } from './factories/firestoreApproval.js'

// Migrated from Prisma/MongoDB to Firestore. Queue behaviour and the
// PENDING_APPROVAL guard live in the shared factory.

const approval = createApprovalController({ collection: 'buses', label: 'Bus', listKey: 'buses' })

export const getPendingBuses = approval.listPending
export const approveBus = approval.approve
export const rejectBus = approval.reject
