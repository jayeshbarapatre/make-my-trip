import { Redis } from '@upstash/redis'

let redis = null

/**
 * Returns a singleton Upstash Redis client.
 *
 * The client uses the REST HTTP API, so it works in serverless environments
 * (Vercel, Edge, etc.) without requiring a persistent TCP connection.
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL   – e.g. https://vital-mammoth-140969.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN – the bearer token from the Upstash console
 */
export const getRedis = () => {
  if (redis) return redis

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.warn('⚠️ UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN not set — Redis disabled')
    return null
  }

  redis = new Redis({ url, token })
  console.log('✅ Upstash Redis client initialised')
  return redis
}

/**
 * Graceful close — no-op for the HTTP client (no persistent connection to drain).
 */
export const closeRedis = async () => {
  redis = null
}

export default getRedis
