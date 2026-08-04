// Loaded before any src/ import: firebase.js reads its credentials at module
// scope, so without this the suite dies on import rather than on assertion.
import 'dotenv/config'

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { requireFirestore } from './firestoreGuard.mjs'
import { readFile, readdir, access } from 'node:fs/promises'
import path from 'node:path'

import { db } from '../src/config/firebase.js'
import { toDate, toMillis, byNewest } from '../src/utils/time.js'

// Firestore-backed suites fail fast instead of hanging on SDK retries when the
// datastore is unreachable (quota exhausted, network down).
const firestoreGate = await requireFirestore()

// Infrastructure configuration: security rules, indexes, and the data shape
// they depend on. All three were either missing or unenforceable.

const repoRoot = new URL('../../', import.meta.url)
const backendRoot = new URL('../', import.meta.url)

const readRoot = (rel) => readFile(new URL(rel, repoRoot), 'utf8')

const toPath = (url) => url.pathname.replace(/^\/([A-Za-z]:)/, '$1')

const walkJs = async (dir) => {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...await walkJs(full))
    else if (entry.name.endsWith('.js')) out.push(full)
  }
  return out
}

describe('Firestore rules and indexes are real configuration', () => {
  // firestore.rules existed but had never been deployed: no firebase.json, no
  // index definitions, no deploy step. The file had no bearing on what the
  // database actually allowed.

  test('firebase.json exists and points at files that exist', async () => {
    const cfg = JSON.parse(await readRoot('firebase.json'))

    assert.ok(cfg.firestore?.rules, 'firestore.rules path must be declared')
    assert.ok(cfg.firestore?.indexes, 'firestore.indexes path must be declared')

    await access(new URL(cfg.firestore.rules, repoRoot))
    await access(new URL(cfg.firestore.indexes, repoRoot))
  })

  test('every index entry is a valid composite', async () => {
    const idx = JSON.parse(await readRoot('firestore.indexes.json'))
    assert.ok(Array.isArray(idx.indexes) && idx.indexes.length > 0)

    for (const entry of idx.indexes) {
      assert.ok(entry.collectionGroup, 'each index needs a collectionGroup')
      assert.ok(
        Array.isArray(entry.fields) && entry.fields.length >= 2,
        `${entry.collectionGroup}: a composite index needs at least 2 fields`
      )
      for (const f of entry.fields) {
        assert.ok(f.fieldPath, 'each field needs a fieldPath')
        assert.match(f.order, /^(ASCENDING|DESCENDING)$/)
      }
    }
  })

  test('no rule grants client access', async () => {
    // All access is server-side through the Admin SDK, which bypasses rules.
    // Anything other than `if false` is reachable by anyone holding the project
    // id, which is public by definition.
    const rules = await readRoot('makemytrip-backend/firestore.rules')

    const allows = rules.split('\n')
      .map((text, i) => ({ line: i + 1, text: text.trim() }))
      .filter((x) => x.text.startsWith('allow '))

    assert.ok(allows.length > 0, 'expected allow statements')
    assert.deepEqual(
      allows.filter((a) => !/if false;/.test(a.text)),
      [],
      'these rules grant direct client access'
    )
  })

  test('rules contain no unreachable request.auth logic', async () => {
    // This app signs its own JWTs, so request.auth is always null. Owner-scoped
    // rules written against it always denied, while reading as though client
    // access worked and was safely scoped.
    const rules = await readRoot('makemytrip-backend/firestore.rules')
    const code = rules.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n')

    assert.ok(!/request\.auth/.test(code), 'request.auth can never be non-null here')
  })

  test('every collection the backend touches has an explicit rule', async () => {
    const files = await walkJs(toPath(new URL('src/', backendRoot)))

    const used = new Set()
    for (const file of files) {
      const src = await readFile(file, 'utf8')
      for (const m of src.matchAll(/collection\('([a-zA-Z_]+)'\)/g)) used.add(m[1])
    }

    const rules = await readRoot('makemytrip-backend/firestore.rules')
    const missing = [...used].filter((c) => !rules.includes(`match /${c}/`))

    assert.deepEqual(missing, [],
      'these collections are written by the code but unnamed in the rules — default-deny covers them, but silently')
  })

  test('the deploy workflow exists and gates on validation', async () => {
    const wf = await readRoot('.github/workflows/firestore-rules.yml')
    assert.match(wf, /firebase deploy/, 'the workflow must actually deploy')
    assert.match(wf, /--only firestore:rules,firestore:indexes/)
    assert.match(wf, /needs: validate/, 'deploy must depend on validation passing')
  })

  test('the frontend has no Firebase client SDK', async () => {
    // This is the precondition that makes total denial safe. If a client SDK is
    // ever introduced, the rules become load-bearing and must be rewritten.
    const pkg = JSON.parse(await readRoot('makemytrip-frontend/package.json'))
    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    assert.deepEqual(
      Object.keys(deps).filter((d) => /firebase/i.test(d)),
      [],
      'a Firebase client SDK would make these deny-all rules break the app'
    )

    const files = await walkJs(toPath(new URL('makemytrip-frontend/src/', repoRoot)))
    const importers = []
    for (const file of files) {
      const src = await readFile(file, 'utf8')
      if (/from ['"]firebase\//.test(src)) importers.push(path.basename(file))
    }
    assert.deepEqual(importers, [], 'these files import the Firebase client SDK')
  })
})

describe('date fields are a single indexable type', firestoreGate, () => {
  // Firestore orders by type before value and a range filter never matches
  // across types, so a field holding both ISO strings and Timestamps cannot be
  // sorted or filtered. Measured before the fix: 27 of 46 bookings and 12 of 26
  // payments held strings, which made the admin "recent bookings" list show the
  // newest bookings last and made "bookings today" permanently zero.

  test('toDate accepts every shape the codebase stores', () => {
    const iso = '2026-07-31T10:00:00.000Z'
    assert.equal(toDate(iso)?.toISOString(), iso)
    assert.equal(toDate(new Date(iso))?.toISOString(), iso)
    assert.equal(toDate({ toDate: () => new Date(iso) })?.toISOString(), iso)
    assert.equal(toDate(Date.parse(iso))?.toISOString(), iso)
  })

  test('toDate returns null rather than an Invalid Date', () => {
    for (const bad of [null, undefined, '', 'not-a-date', {}, NaN]) {
      assert.equal(toDate(bad), null, `toDate(${String(bad)}) should be null`)
    }
  })

  test('byNewest orders correctly across mixed shapes', () => {
    const older = '2026-07-01T00:00:00.000Z'
    const newer = '2026-07-31T00:00:00.000Z'

    const docs = [
      { id: 'string-older', createdAt: older },
      { id: 'ts-newer', createdAt: { toDate: () => new Date(newer) } },
      { id: 'string-newer', createdAt: newer },
      { id: 'ts-older', createdAt: { toDate: () => new Date(older) } }
    ]

    const ms = [...docs].sort(byNewest('createdAt')).map((d) => toMillis(d.createdAt))
    assert.ok(ms.every((v, i) => i === 0 || ms[i - 1] >= v), 'must be newest-first regardless of type')
  })

  test('stored date fields are all Timestamps', async () => {
    for (const collection of ['bookings', 'payments', 'refunds', 'users']) {
      const snap = await db.collection(collection).get()
      const strings = snap.docs.filter((d) => typeof d.data().createdAt === 'string')
      assert.equal(strings.length, 0,
        `${collection}: ${strings.length} document(s) still store createdAt as a string — run npm run migrate:timestamps`)
    }
  })

  test('a range query on createdAt matches stored documents', async () => {
    // This returned 0 for every window before the migration.
    const since = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
    const matched = await db.collection('bookings').where('createdAt', '>=', since).get()
    const total = (await db.collection('bookings').get()).size

    assert.ok(matched.size > 0, 'a range query must match something')
    assert.equal(matched.size, total, 'every booking is within the last year and must match')
  })

  test('the admin booking list is ordered newest-first', async () => {
    const { getAllBookings } = await import('../src/controllers/firebaseBookingController.js')

    const body = await new Promise((resolve) => {
      const res = { status() { return this }, json(b) { resolve(b) } }
      getAllBookings({}, res)
    })

    const ms = body.data.map((b) => toMillis(b.createdAt))
    assert.ok(ms.length > 0)
    assert.ok(ms.every((v, i) => i === 0 || ms[i - 1] >= v),
      'string-dated bookings were grouped ahead of Timestamp-dated ones, listing the newest last')
  })

  test('toDate is not reimplemented anywhere', async () => {
    // It existed as six divergent copies, and the two call sites WITHOUT a copy
    // were exactly the two that were broken.
    const files = await walkJs(toPath(new URL('src/', backendRoot)))

    const offenders = []
    for (const file of files) {
      if (file.endsWith(path.join('utils', 'time.js'))) continue
      const src = await readFile(file, 'utf8')
      if (/^const toDate = \(value\)/m.test(src)) offenders.push(path.basename(file))
    }

    assert.deepEqual(offenders, [], 'these files reimplement toDate instead of importing it')
  })
})

describe('container images are production-correct', () => {
  // The backend image had three defects that only surface at runtime in a
  // container, so no unit test or local run would have caught them.

  const dockerfile = () => readFile(new URL('../Dockerfile', import.meta.url), 'utf8')

  test('the entrypoint is not npm, so SIGTERM reaches node', async () => {
    // `CMD ["npm","run","start"]` makes npm PID 1. npm does not forward SIGTERM,
    // so the graceful-shutdown handler in src/index.js never ran and
    // `docker stop` killed in-flight requests instead of draining them.
    const df = await dockerfile()
    assert.ok(!/CMD\s*\[\s*"npm"/.test(df), 'npm must not be PID 1')
    assert.match(df, /CMD \["node", "src\/index\.js"\]/)
  })

  test('the upload directory exists and is owned by the runtime user', async () => {
    // uploadMiddleware calls fs.mkdirSync at import time. With /app root-owned
    // and USER set to a non-root user, that throws EACCES and the container
    // crashes on boot.
    const df = await dockerfile()
    assert.match(df, /mkdir -p \/app\/public\/uploads/)
    assert.match(df, /chown -R node:node \/app\/public/)
  })

  test('dependencies are installed reproducibly', async () => {
    const df = await dockerfile()
    assert.match(df, /npm ci/, 'npm ci pins to package-lock; npm install does not')
    assert.ok(!/RUN npm install/.test(df))
  })

  test('the base image is a supported Node release', async () => {
    // node:18 reached end-of-life in April 2025 and gets no security patches.
    for (const rel of ['../Dockerfile', '../../makemytrip-frontend/Dockerfile']) {
      const df = await readFile(new URL(rel, import.meta.url), 'utf8')
      const bases = [...df.matchAll(/FROM node:(\d+)/g)].map((m) => Number(m[1]))
      for (const major of bases) {
        assert.ok(major >= 20, `${rel} uses node:${major}, which is end-of-life`)
      }
    }
  })

  test('the image declares a healthcheck against the real endpoint', async () => {
    const df = await dockerfile()
    assert.match(df, /HEALTHCHECK/)
    assert.match(df, /\/health/)
  })

  test('secrets and build artefacts are excluded from the image', async () => {
    const ignore = await readFile(new URL('../.dockerignore', import.meta.url), 'utf8')
    for (const entry of ['.env', 'serviceAccountKey.json', 'node_modules', 'tests', 'dist']) {
      assert.ok(ignore.includes(entry), `.dockerignore must exclude ${entry}`)
    }
  })
})
