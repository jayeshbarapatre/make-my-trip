import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { existsSync } from 'fs'
import { resolve } from 'path'

let db = null

if (!getApps().length) {
  const keyFilePath = resolve(process.cwd(), 'serviceAccountKey.json')

  console.log('🔥 Initializing Firebase...')

  if (existsSync(keyFilePath)) {
    console.log('✅ Found serviceAccountKey.json, using it for Firebase initialization')
    const require = createRequire(import.meta.url)
    const serviceAccount = require(keyFilePath)
    initializeApp({ credential: cert(serviceAccount) })
  } else {
    console.log('📝 Using environment variables for Firebase initialization')

    const projectId = process.env.FIREBASE_PROJECT_ID
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
    let privateKey = process.env.FIREBASE_PRIVATE_KEY

    console.log(`📋 Firebase Project ID: ${projectId}`)
    console.log(`📧 Firebase Client Email: ${clientEmail}`)

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Firebase credentials missing. Either place serviceAccountKey.json in the backend root, ' +
        'or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env'
      )
    }

    // Handle private key formatting
    // The key might have literal \n characters that need to be converted to actual newlines
    if (typeof privateKey === 'string') {
      // Remove surrounding quotes if present
      privateKey = privateKey.replace(/^["']|["']$/g, '')
      // Convert literal \n to actual newlines
      privateKey = privateKey.replace(/\\n/g, '\n')
    }

    // The key's length is not logged: it is a property of the secret itself and
    // narrows an offline guess. A failed cert() below already reports a
    // malformed key without needing it.
    try {
      if (process.env.FIRESTORE_EMULATOR_HOST) {
        console.log(`🔌 Connecting to Firestore Emulator at ${process.env.FIRESTORE_EMULATOR_HOST}`)
        initializeApp({ projectId })
      } else {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        })
      }
      console.log('✅ Firebase app initialized successfully')
    } catch (err) {
      console.error('❌ Firebase initialization error:', err.message)
      throw err
    }
  }
}

// Get Firestore instance
try {
  db = getFirestore()
  db.settings({ ignoreUndefinedProperties: true })
  console.log('✅ Firestore database connected')
} catch (err) {
  console.error('❌ Firestore connection error:', err.message)
  throw err
}

export { db }
