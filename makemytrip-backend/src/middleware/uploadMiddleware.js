import multer from 'multer'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = path.join(__dirname, '../../public/uploads')

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

/**
 * Allowed types, and the ONE extension each may be stored under.
 *
 * The stored extension is derived from this table, never from the uploaded
 * filename. `file.mimetype` is just the Content-Type the client put on the
 * multipart part — it is not inspected or verified by multer — so previously an
 * attacker could send `Content-Type: image/png` with the filename `evil.html`,
 * pass the type filter, and have the file written as `evil-<suffix>.html`.
 *
 * `/uploads` is served by express.static, which sets Content-Type from the file
 * extension. `X-Content-Type-Options: nosniff` does not help there: it stops the
 * browser guessing a type, but the declared type would genuinely have been
 * text/html. The result was stored XSS on the API origin — and because tokens
 * were readable from localStorage, a viable path to session theft.
 *
 * Pinning the extension to the claimed type means the worst an attacker can do
 * is store HTML that is served as image/png, which no browser will execute.
 */
const ALLOWED_TYPES = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/gif', '.gif'],
  ['image/webp', '.webp'],
  ['application/pdf', '.pdf'],
  ['text/csv', '.csv']
])

/**
 * Reduces a user-supplied filename to a safe slug. Only used for readability in
 * the stored name — uniqueness comes from the random suffix, so a fully
 * stripped name is harmless.
 */
const safeStem = (originalname) => {
  const stem = path.basename(String(originalname ?? ''), path.extname(String(originalname ?? '')))
  const cleaned = stem
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')
    .slice(0, 60)
  return cleaned || 'upload'
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir)
  },
  filename: (_req, file, cb) => {
    const ext = ALLOWED_TYPES.get(file.mimetype)
    if (!ext) return cb(new Error('Invalid file type'))

    // Random rather than timestamp-based: two uploads in the same millisecond
    // previously relied on Math.random alone, and a predictable name lets one
    // caller guess (and a misconfigured handler overwrite) another's file.
    const suffix = crypto.randomBytes(8).toString('hex')
    cb(null, `${safeStem(file.originalname)}-${suffix}${ext}`)
  }
})

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES.has(file.mimetype)) return cb(null, true)
  cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WebP, PDF, and CSV are allowed.'))
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    // Without these, one request can carry thousands of parts and fields.
    files: 1,
    fields: 20
  }
})

export const ALLOWED_UPLOAD_TYPES = ALLOWED_TYPES
export { safeStem }
