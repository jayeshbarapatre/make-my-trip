import 'dotenv/config'
console.log('✅ dotenv loaded')

import express from 'express'
console.log('✅ express loaded')

import cors from 'cors'
console.log('✅ cors loaded')

import { connectDB } from './src/config/db.js'
console.log('✅ db.js loaded')

import { getRedis } from './src/config/redis.js'
console.log('✅ redis.js loaded')

console.log('About to import emailQueue...')
import { emailQueue } from './src/queues/emailQueue.js'
console.log('✅ emailQueue loaded:', emailQueue ? 'initialized' : 'null')

console.log('About to import reminderScheduler...')
import { initializeScheduledJobs } from './src/queues/reminderScheduler.js'
console.log('✅ reminderScheduler loaded')

console.log('About to import mockDataMiddleware...')
import { mockDataMiddleware } from './src/middleware/useMockData.js'
console.log('✅ mockDataMiddleware loaded')

console.log('About to import auth routes...')
import authRoutes from './src/routes/auth.js'
console.log('✅ auth routes loaded')

console.log('All imports successful!')
process.exit(0)
