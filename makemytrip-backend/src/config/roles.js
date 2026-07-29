// Single source of truth for roles, permissions, and account status.
// Permissions are derived from role rather than stored per user, so a role
// change takes effect everywhere at once and cannot drift between documents.

export const Role = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
}

export const AccountStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DISABLED: 'disabled',
  REJECTED: 'rejected'
}

// Only these statuses may authenticate and act.
export const ACTIVE_STATUSES = new Set([AccountStatus.ACTIVE])

export const Permission = {
  BOOKING_CREATE: 'booking:create',
  BOOKING_READ_OWN: 'booking:read:own',
  BOOKING_READ_ANY: 'booking:read:any',
  BOOKING_CANCEL_OWN: 'booking:cancel:own',
  BOOKING_CANCEL_ANY: 'booking:cancel:any',

  INVENTORY_READ_OWN: 'inventory:read:own',
  INVENTORY_WRITE_OWN: 'inventory:write:own',
  INVENTORY_READ_ANY: 'inventory:read:any',
  INVENTORY_WRITE_ANY: 'inventory:write:any',

  VENDOR_MANAGE: 'vendor:manage',
  VENDOR_APPROVE: 'vendor:approve',

  USER_MANAGE: 'user:manage',
  LISTING_APPROVE: 'listing:approve',
  REFUND_APPROVE: 'refund:approve',
  REPORT_READ_OWN: 'report:read:own',
  REPORT_READ_ANY: 'report:read:any',
  AUDIT_READ: 'audit:read',
  SETTINGS_WRITE: 'settings:write'
}

const CUSTOMER_PERMISSIONS = [
  Permission.BOOKING_CREATE,
  Permission.BOOKING_READ_OWN,
  Permission.BOOKING_CANCEL_OWN
]

const VENDOR_PERMISSIONS = [
  Permission.INVENTORY_READ_OWN,
  Permission.INVENTORY_WRITE_OWN,
  Permission.BOOKING_READ_OWN,
  Permission.REPORT_READ_OWN
]

const ADMIN_PERMISSIONS = [
  ...Object.values(Permission).filter((p) => p !== Permission.SETTINGS_WRITE)
]

const SUPER_ADMIN_PERMISSIONS = Object.values(Permission)

const MATRIX = {
  [Role.CUSTOMER]: CUSTOMER_PERMISSIONS,
  [Role.VENDOR]: VENDOR_PERMISSIONS,
  [Role.ADMIN]: ADMIN_PERMISSIONS,
  [Role.SUPER_ADMIN]: SUPER_ADMIN_PERMISSIONS
}

export const permissionsForRole = (role) => MATRIX[role] || MATRIX[Role.CUSTOMER]

export const roleHasPermission = (role, permission) => permissionsForRole(role).includes(permission)

export const isPrivileged = (role) => role === Role.ADMIN || role === Role.SUPER_ADMIN

// Legacy user documents predate the role field and carry `is_admin` instead.
export const resolveRole = (userDoc = {}) => {
  if (userDoc.role) return userDoc.role
  if (userDoc.is_admin === true) return Role.ADMIN
  return Role.CUSTOMER
}

export const resolveAccountStatus = (userDoc = {}) =>
  userDoc.accountStatus || AccountStatus.ACTIVE
