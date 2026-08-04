// An in-memory stand-in for the Firestore Admin SDK, covering the subset the
// availability engine uses: nested collections, document get/set/update, and
// runTransaction.
//
// It exists so that overselling, multi-night atomicity and cancellation can be
// tested deterministically. The real datastore is unsuitable for this: it costs
// quota (the project has already exhausted a daily free-tier allowance once),
// it cannot be made to interleave two transactions on demand, and a test that
// depends on winning a real race is a test that fails randomly in CI.
//
// The important behaviour it reproduces is Firestore's concurrency control:
// a transaction records the version of every document it reads, and its commit
// is rejected if any of those changed in the meantime. That is what makes
// "two concurrent bookings for the last seat" resolve to one success and one
// retry rather than two successes.

class FakeSnapshot {
  constructor (id, ref, record) {
    this.id = id
    this.ref = ref
    this.exists = record !== undefined
    this._data = record?.data
  }

  data () {
    // Return a copy so a caller mutating the result cannot reach into the store.
    return this._data === undefined ? undefined : structuredClone(this._data)
  }
}

class FakeDocRef {
  constructor (store, path) {
    this.store = store
    this.path = path
    this.id = path.split('/').pop()
  }

  collection (name) {
    return new FakeCollectionRef(this.store, `${this.path}/${name}`)
  }

  async get () {
    this.store.reads++
    return new FakeSnapshot(this.id, this, this.store.records.get(this.path))
  }

  async set (data, options = {}) {
    this.store.write(this.path, data, options.merge === true)
  }

  async update (data) {
    if (!this.store.records.has(this.path)) {
      const err = new Error(`NOT_FOUND: no document to update at ${this.path}`)
      err.code = 5
      throw err
    }
    this.store.write(this.path, data, true)
  }

  async delete () {
    this.store.records.delete(this.path)
    this.store.versions.set(this.path, (this.store.versions.get(this.path) ?? 0) + 1)
  }
}

/** Firestore's `where` operators, over plain JS values. */
const OPS = {
  '==': (a, b) => a === b,
  '!=': (a, b) => a !== b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  in: (a, b) => Array.isArray(b) && b.includes(a),
  'not-in': (a, b) => Array.isArray(b) && !b.includes(a),
  'array-contains': (a, b) => Array.isArray(a) && a.includes(b),
  'array-contains-any': (a, b) => Array.isArray(a) && Array.isArray(b) && b.some((v) => a.includes(v))
}

class FakeQuery {
  constructor (store, path, filters = [], limitCount = null) {
    this.store = store
    this.path = path
    this.filters = filters
    this.limitCount = limitCount
  }

  where (field, op, value) {
    if (!OPS[op]) throw new Error(`Unsupported where operator "${op}"`)
    return new FakeQuery(this.store, this.path, [...this.filters, { field, op, value }], this.limitCount)
  }

  limit (n) {
    return new FakeQuery(this.store, this.path, this.filters, n)
  }

  /** Matching documents, ordered by id, before the limit is applied. */
  _matches () {
    const prefix = `${this.path}/`
    return [...this.store.records.keys()]
      .filter((p) => p.startsWith(prefix) && !p.slice(prefix.length).includes('/'))
      .sort()
      .filter((p) => {
        const data = this.store.records.get(p)?.data ?? {}
        // Firestore drops documents that lack a filtered field entirely — the
        // behaviour that made unindexed inventory invisible to search.
        return this.filters.every(({ field, op, value }) =>
          field in data && OPS[op](data[field], value))
      })
  }

  async get () {
    const paths = this._matches()
    const limited = this.limitCount === null ? paths : paths.slice(0, this.limitCount)
    const docs = limited.map((p) =>
      new FakeSnapshot(p.split('/').pop(), new FakeDocRef(this.store, p), this.store.records.get(p)))

    this.store.reads += docs.length
    return { docs, size: docs.length, empty: docs.length === 0, forEach: (f) => docs.forEach(f) }
  }

  /**
   * Aggregate count. Firestore bills one read per 1000 index entries rather
   * than one per document, which is why search can afford to probe with it.
   */
  count () {
    return {
      get: async () => {
        const total = this._matches().length
        this.store.reads += Math.max(1, Math.ceil(total / 1000))
        return { data: () => ({ count: total }) }
      }
    }
  }
}

class FakeCollectionRef extends FakeQuery {
  doc (id) {
    return new FakeDocRef(this.store, `${this.path}/${id}`)
  }
}

class FakeWriteBatch {
  constructor (store) {
    this.store = store
    this.ops = []
  }

  set (ref, data, options = {}) {
    this.ops.push({ path: ref.path, data, merge: options.merge === true })
    return this
  }

  update (ref, data) {
    this.ops.push({ path: ref.path, data, merge: true })
    return this
  }

  delete (ref) {
    this.ops.push({ path: ref.path, delete: true })
    return this
  }

  async commit () {
    for (const op of this.ops) {
      if (op.delete) {
        this.store.records.delete(op.path)
        this.store.versions.set(op.path, (this.store.versions.get(op.path) ?? 0) + 1)
        continue
      }
      this.store.write(op.path, op.data, op.merge)
    }
    const n = this.ops.length
    this.ops = []
    return n
  }
}

class FakeTransaction {
  constructor (store) {
    this.store = store
    this.readVersions = new Map()
    this.writes = []
    this.wroteBeforeRead = false
    this.hasWritten = false
  }

  async get (ref) {
    // Firestore rejects a read issued after a write in the same transaction.
    if (this.hasWritten) {
      throw new Error('INVALID_ARGUMENT: Firestore transactions require all reads before any write')
    }
    this.readVersions.set(ref.path, this.store.versions.get(ref.path) ?? 0)
    this.store.reads++
    return new FakeSnapshot(ref.id, ref, this.store.records.get(ref.path))
  }

  set (ref, data, options = {}) {
    this.hasWritten = true
    this.writes.push({ path: ref.path, data, merge: options.merge === true })
  }

  update (ref, data) {
    this.hasWritten = true
    this.writes.push({ path: ref.path, data, merge: true, requireExists: true })
  }

  delete (ref) {
    this.hasWritten = true
    this.writes.push({ path: ref.path, delete: true })
  }

  /** @returns {boolean} false when a document read by this transaction moved on. */
  tryCommit () {
    for (const [path, version] of this.readVersions) {
      if ((this.store.versions.get(path) ?? 0) !== version) return false
    }

    for (const w of this.writes) {
      if (w.delete) {
        this.store.records.delete(w.path)
        this.store.versions.set(w.path, (this.store.versions.get(w.path) ?? 0) + 1)
        continue
      }
      if (w.requireExists && !this.store.records.has(w.path)) {
        const err = new Error(`NOT_FOUND: no document to update at ${w.path}`)
        err.code = 5
        throw err
      }
      this.store.write(w.path, w.data, w.merge)
    }
    return true
  }
}

export class FakeFirestore {
  constructor () {
    this.records = new Map()
    this.versions = new Map()
    this.reads = 0
    this.commits = 0
    this.retries = 0
    /** Test hook: awaited after a transaction body runs, before its commit. */
    this.beforeCommit = null
  }

  collection (name) {
    return new FakeCollectionRef(this, name)
  }

  batch () {
    return new FakeWriteBatch(this)
  }

  write (path, data, merge) {
    const existing = merge ? this.records.get(path)?.data ?? {} : {}
    this.records.set(path, { data: structuredClone({ ...existing, ...data }) })
    this.versions.set(path, (this.versions.get(path) ?? 0) + 1)
  }

  /** Seeds a document without touching version bookkeeping semantics. */
  seed (path, data) {
    this.records.set(path, { data: structuredClone(data) })
    this.versions.set(path, (this.versions.get(path) ?? 0) + 1)
    return this
  }

  peek (path) {
    return structuredClone(this.records.get(path)?.data)
  }

  async runTransaction (fn, { maxAttempts = 5 } = {}) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const tx = new FakeTransaction(this)
      const result = await fn(tx)

      if (this.beforeCommit) await this.beforeCommit(attempt, tx)

      if (tx.tryCommit()) {
        this.commits++
        return result
      }
      this.retries++
    }

    const err = new Error('ABORTED: too much contention on the documents involved')
    err.code = 10
    throw err
  }
}

export const newDb = () => new FakeFirestore()
