// Conditional logging utility - only logs in development mode

const isDev = process.env.NODE_ENV !== 'production'

export const logger = {
  log: (message, data = null) => {
    if (isDev) {
      console.log(`📝 ${message}`, data || '')
    }
  },

  info: (message, data = null) => {
    if (isDev) {
      console.log(`ℹ️  ${message}`, data || '')
    }
  },

  warn: (message, data = null) => {
    console.warn(`⚠️  ${message}`, data || '')
  },

  error: (message, error = null) => {
    console.error(`❌ ${message}`, error || '')
  },

  success: (message, data = null) => {
    if (isDev) {
      console.log(`✅ ${message}`, data || '')
    }
  }
}

export default logger
