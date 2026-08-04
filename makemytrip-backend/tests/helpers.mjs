// Shared helpers for the integration suite.
//
// These are integration tests, not unit tests: they drive the real Express app
// against the real Firestore project, because the defects they guard against
// (client-set prices, mass assignment, unpaid bookings, privilege escalation)
// all lived in the seams between routing, middleware and the database. A mocked
// datastore would not have caught any of them.
//
// Every document they create is tagged so `cleanupTestData()` can remove it.

export const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5199'
export const API = `${BASE_URL}/api/v1`

// Marks every account this suite creates, so cleanup can find them and a human
// can recognise them in the console.
export const TEST_EMAIL_PREFIX = 'itest_'

export const testEmail = () =>
  `${TEST_EMAIL_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2, 8)}@integration.test`

const createdEmails = []

export const request = async (method, path, { token, body, headers = {}, raw } = {}) => {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      ...(body || raw ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers
    },
    body: raw ?? (body ? JSON.stringify(body) : undefined)
  })

  let json = null
  const text = await res.text()
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    json = { _unparsed: text.slice(0, 200) }
  }

  return { status: res.status, headers: res.headers, body: json }
}

export const get = (path, opts) => request('GET', path, opts)
export const post = (path, body, opts) => request('POST', path, { ...opts, body })

/** Registers a fresh customer and returns { token, email, id }. */
export const registerCustomer = async () => {
  const email = testEmail()
  const { status, body } = await post('/auth/register', {
    name: 'Integration Test',
    email,
    password: 'IntegrationPass123!',
    phone: `9${Math.floor(100000000 + Math.random() * 899999999)}`
  })

  if (status !== 200 && status !== 201) {
    throw new Error(`Could not register a test customer (${status}): ${JSON.stringify(body)}`)
  }

  const token = body?.data?.token
  const id = body?.data?.user?.id
  if (!token) throw new Error('Registration returned no token')

  createdEmails.push(email)
  return { token, email, id }
}

/** First active item id from a catalog search, or null when none is seeded. */
export const firstCatalogItem = async (path) => {
  const { body } = await get(path)
  const list = Array.isArray(body?.data) ? body.data : []
  return list[0] ?? null
}

/**
 * Removes the users this run created. Called once at the end of the suite so a
 * CI run does not accumulate accounts in the shared project.
 */
export const cleanupTestData = async () => {
  if (!createdEmails.length) return { removed: 0 }

  const { db } = await import('../src/config/firebase.js')
  let removed = 0

  for (const email of createdEmails) {
    try {
      await db.collection('users').doc(email).delete()
      removed++
    } catch {
      // A failed cleanup must never fail the suite; the tag makes leftovers findable.
    }
  }

  return { removed }
}
