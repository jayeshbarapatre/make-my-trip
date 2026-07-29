console.log('1. Testing dotenv...')
import 'dotenv/config'
console.log('✅ dotenv')

console.log('2. Testing express...')
import express from 'express'
console.log('✅ express')

console.log('3. Testing cors...')
import cors from 'cors'
console.log('✅ cors')

console.log('4. Testing db.js...')
import { connectDB } from './src/config/db.js'
console.log('✅ db.js')

console.log('5. Testing redis.js...')
import { getRedis } from './src/config/redis.js'
console.log('✅ redis.js (imported, not called yet)')

console.log('6. Testing auth routes (expensive)...')
import authRoutes from './src/routes/auth.js'
console.log('✅ auth routes')

console.log('All tests passed!')
process.exit(0)
