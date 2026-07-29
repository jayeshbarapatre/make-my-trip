import Redis from 'ioredis'

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379'

let redis = null
let isConnecting = false

export const getRedis = () => {
  if (!redis && !isConnecting) {
    isConnecting = true

    // Create connection but don't block on it
    redis = new Redis(redisUrl, {
      enableReadyCheck: false, // Don't wait for ready status
      enableOfflineQueue: false, // Don't queue commands while disconnected
      retryStrategy: (times) => {
        if (times > 10) return null // Stop retrying after 10 attempts
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      maxRetriesPerRequest: null,
      connectTimeout: 3000, // 3 second timeout
      lazyConnect: false // Connect immediately but don't block
    })

    redis.on('connect', () => {
      console.log('✅ Redis connected')
    })

    redis.on('error', (err) => {
      console.warn('⚠️ Redis error:', err.message, '(will continue without Redis)')
    })

    redis.on('close', () => {
      console.log('⚠️ Redis disconnected')
    })
  }

  return redis
}

export const closeRedis = async () => {
  if (redis) {
    await redis.quit()
    redis = null
  }
}

export default getRedis
