/**
 * Publishes the built-in email templates into Firestore so they become editable
 * in the admin panel.
 *
 * Ported from Prisma/Postgres. The previous version wrote to `prisma.emailTemplate`
 * while `templateService` reads the `email_templates` collection in Firestore —
 * so running the documented `npm run seed:email-templates` appeared to succeed
 * and produced nothing the application could see.
 *
 * Seeding is optional: `templateService` already falls back to DEFAULT_TEMPLATES
 * for any key with no stored document. The point of this script is to make the
 * defaults visible and editable, not to make email work.
 *
 * Customised templates are preserved by default, so re-running never silently
 * reverts an edit an operator made in the admin panel. --force resets them.
 *
 * Run from makemytrip-backend:
 *   npm run seed:email-templates             # create missing templates only
 *   npm run seed:email-templates -- --force  # reset customised templates
 */

import 'dotenv/config'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '../src/config/firebase.js'
import { DEFAULT_TEMPLATES } from '../src/config/defaultEmailTemplates.js'
import assertNotProduction from './lib/prodGuard.js'

const COLLECTION = 'email_templates'
const banner = (t) => console.log('\n' + '='.repeat(60) + '\n' + t + '\n' + '='.repeat(60))

const main = async () => {
  const force = process.argv.includes('--force')

  // --force overwrites operator-authored template copy.
  assertNotProduction('This script writes email templates and can overwrite edits.')

  banner(force ? 'EMAIL TEMPLATE SEED (FORCE RESET)' : 'EMAIL TEMPLATE SEED')

  let created = 0
  let reset = 0
  let preserved = 0

  for (const [key, template] of Object.entries(DEFAULT_TEMPLATES)) {
    const ref = db.collection(COLLECTION).doc(key)
    const existing = await ref.get()

    if (existing.exists && !force) {
      preserved++
      continue
    }

    await ref.set({
      key,
      name: template.name,
      module: template.module,
      subject: template.subject,
      htmlBody: template.htmlBody,
      variables: template.variables ?? [],
      isActive: true,
      updatedAt: FieldValue.serverTimestamp(),
      isDeleted: false,
      ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() })
    }, { merge: true })

    if (existing.exists) {
      reset++
      console.log(`  reset   ${key}`)
    } else {
      created++
      console.log(`  created ${key}`)
    }
  }

  banner('EMAIL TEMPLATE SEED COMPLETE')
  console.log(`  ${created} created, ${reset} reset, ${preserved} left customised`)
  if (preserved && !force) {
    console.log('  Re-run with --force to reset customised templates to their defaults.')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Email template seed failed:', err)
    process.exit(1)
  })
