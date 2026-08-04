// Canonical user identity. Firestore keys the `users` collection by email
// address, and a document id is byte-compared — so `John@Ex.com` and
// `john@ex.com` are two different accounts.
//
// That mismatch was live: registration, customer login, admin login and vendor
// login all keyed on the raw request value, while otpService lowercases every
// identifier before hashing. The result was that anyone who typed a capital
// letter at signup could never receive an email OTP or reset their password —
// the lookup for the lowercased address simply missed — and the same person
// could register a second, separate account by varying the case.
//
// Everything that resolves a user by email must go through here.

/**
 * The canonical form of an email address: trimmed and lowercased.
 *
 * The local part of an address is technically case-sensitive per RFC 5321, but
 * no mail provider in practice treats it that way, and every major consumer
 * platform folds case. Folding is what users expect; not folding silently
 * splits an account in two.
 *
 * @returns {string} the canonical address, or '' for any non-string input
 */
export const normalizeEmail = (email) =>
  typeof email === 'string' ? email.trim().toLowerCase() : ''

/**
 * The document reference an account is stored at. Always the canonical form:
 * new records are only ever written here.
 */
export const userRefForEmail = (db, email) =>
  db.collection('users').doc(normalizeEmail(email))

/**
 * Resolves an account by email, tolerating records written before addresses
 * were canonicalised.
 *
 * The canonical document wins. The raw-cased fallback exists so a legacy
 * mixed-case account is not locked out of its own login between this change
 * shipping and `scripts/normalizeUserEmails.js` running; it is a read path
 * only, and never a write target.
 *
 * @returns {Promise<{ref: FirebaseFirestore.DocumentReference, data: object, legacy: boolean}|null>}
 */
export const findUserByEmail = async (db, email) => {
  const canonical = normalizeEmail(email)
  if (!canonical) return null

  const canonicalSnap = await db.collection('users').doc(canonical).get()
  if (canonicalSnap.exists) {
    return { ref: canonicalSnap.ref, data: canonicalSnap.data(), legacy: false }
  }

  const raw = typeof email === 'string' ? email.trim() : ''
  if (raw && raw !== canonical) {
    const legacySnap = await db.collection('users').doc(raw).get()
    if (legacySnap.exists) {
      return { ref: legacySnap.ref, data: legacySnap.data(), legacy: true }
    }
  }

  return null
}

export default { normalizeEmail, userRefForEmail, findUserByEmail }
