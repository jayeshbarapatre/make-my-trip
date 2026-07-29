console.log('Starting dotenv test...')
import 'dotenv/config'
console.log('✅ dotenv loaded')
console.log('PORT:', process.env.PORT)
console.log('Test complete')
process.exit(0)
