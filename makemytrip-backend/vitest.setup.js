import dotenv from 'dotenv'

// Load .env.test if it exists, otherwise .env
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env'
dotenv.config({ path: envFile })

// Suppress console output in tests (except errors)
const originalLog = console.log
const originalWarn = console.warn

global.console.log = (...args) => {
  if (process.env.DEBUG_TESTS === 'true') {
    originalLog(...args)
  }
}

global.console.warn = (...args) => {
  if (process.env.DEBUG_TESTS === 'true') {
    originalWarn(...args)
  }
}
