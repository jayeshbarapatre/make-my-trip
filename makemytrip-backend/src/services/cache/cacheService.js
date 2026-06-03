// Simple in-memory TTL cache for search results
// Strategy: Store results with expiration timestamps
// Future: Can be swapped for Redis without changing the interface

const store = new Map()
let lastFlushTime = new Date().toISOString()

export const cacheService = {
  get: (key) => {
    const entry = store.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiresAt) {
      store.delete(key)
      return null
    }

    return entry.data
  },

  set: (key, data, ttlSeconds = 300) => {
    store.set(key, {
      data,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  },

  del: (key) => {
    store.delete(key)
  },

  clear: () => {
    store.clear()
    lastFlushTime = new Date().toISOString()
  },

  // Get cache statistics
  stats: () => {
    let expiredCount = 0
    store.forEach(entry => {
      if (Date.now() > entry.expiresAt) expiredCount++
    })
    return {
      totalKeys: store.size,
      expiredKeys: expiredCount,
      activeKeys: store.size - expiredCount,
      lastFlush: lastFlushTime
    }
  },

  // Get keys matching a prefix
  getKeysByPrefix: (prefix) => {
    const keys = []
    store.forEach((entry, key) => {
      if (key.startsWith(prefix)) {
        keys.push(key)
      }
    })
    return keys
  }
}

export default cacheService
