console.log('1. Loading dotenv...')
import 'dotenv/config'
console.log('2. Loading express...')
import express from 'express'
console.log('3. Loading cors...')
import cors from 'cors'
console.log('4. Loading db config...')
import { connectDB } from './src/config/db.js'
console.log('5. Loading redis...')
import { getRedis } from './src/config/redis.js'
console.log('6. Loading email queue...')
import { getEmailQueue } from './src/queues/emailQueue.js'
console.log('7. Loading reminder scheduler...')
import { initializeScheduledJobs } from './src/queues/reminderScheduler.js'
console.log('8. Loading mock data middleware...')
import { mockDataMiddleware } from './src/middleware/useMockData.js'
console.log('9. Creating app...')
const app = express()
console.log('10. Done!')
process.exit(0)
