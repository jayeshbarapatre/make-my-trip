import express from 'express'

const app = express()

app.get('/test', (req, res) => {
  res.json({ status: 'ok' })
})

const server = app.listen(5000, () => {
  console.log('Server started on port 5000')
  console.log('Visit http://localhost:5000/test')
})

setTimeout(() => {
  console.log('Closing server...')
  server.close()
  process.exit(0)
}, 10000)
