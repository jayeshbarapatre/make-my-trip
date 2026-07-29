import http from 'http'

const maxAttempts = 10
let attempts = 0

const testHealth = () => {
  attempts++

  const request = http.get('http://localhost:5000/health', (res) => {
    let data = ''
    res.on('data', chunk => data += chunk)
    res.on('end', () => {
      console.log(`✅ SUCCESS on attempt ${attempts}!`)
      console.log('Response:', data)
      process.exit(0)
    })
  })

  request.on('error', (err) => {
    if (attempts < maxAttempts) {
      console.log(`⏳ Attempt ${attempts} failed, retrying in 1s...`)
      setTimeout(testHealth, 1000)
    } else {
      console.log(`❌ Failed after ${maxAttempts} attempts`)
      process.exit(1)
    }
  })

  request.setTimeout(2000)
}

console.log('🧪 Testing backend health endpoint...')
testHealth()
