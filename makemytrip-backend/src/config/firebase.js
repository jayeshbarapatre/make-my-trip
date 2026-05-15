import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { createRequire } from 'module'
import { existsSync } from 'fs'
import { resolve } from 'path'

if (!getApps().length) {
  const keyFilePath = resolve(process.cwd(), 'serviceAccountKey.json')

  if (existsSync(keyFilePath)) {
    // Preferred: use the downloaded JSON file directly (no PEM parsing issues)
    const require = createRequire(import.meta.url)
    const serviceAccount = require(keyFilePath)
    initializeApp({ credential: cert(serviceAccount) })
  } else {
    // Fallback: use individual env vars
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ?.replace(/\\n/g, '\n')   // handle literal \n from .env
      ?.replace(/^"|"$/g, '')   // strip surrounding quotes if any

    if (!privateKey || !process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      throw new Error(
        'Firebase credentials missing. Either place serviceAccountKey.json in the backend root, ' +
        'or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in .env'
      )
    }
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      }),
    })
  }
}

export const db = getFirestore()
