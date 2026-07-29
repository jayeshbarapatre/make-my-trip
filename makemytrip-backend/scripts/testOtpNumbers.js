#!/usr/bin/env node
/**
 * OTP verification across multiple mobile numbers.
 *
 *   npm run test:otp                      # against http://localhost:5000
 *   API_BASE=http://localhost:5055/api/v1 npm run test:otp
 *
 * How the "successful login" case works without a production backdoor:
 * the script issues a code through otpService directly (same Firestore the
 * server reads) and then POSTs that code to the real /auth/verify-otp
 * endpoint over HTTP. Nothing in the server grants the test special access.
 *
 * Real SMS delivery is exercised only when Twilio is configured; otherwise
 * the delivery case is reported as BLOCKED rather than passed.
 */
import 'dotenv/config'
import * as otpService from '../src/services/otpService.js'
import { db } from '../src/config/firebase.js'
import { providerStatus, toE164 } from '../src/services/sms/smsService.js'

const BASE = process.env.API_BASE || 'http://localhost:5000/api/v1'

// Five distinct Indian mobile numbers, each exercising a different case.
const NUMBERS = [
  { phone: '9876543210', label: 'happy path' },
  { phone: '9812345678', label: 'wrong code then correct' },
  { phone: '9955512340', label: 'expiry' },
  { phone: '9700011122', label: 'attempt cap' },
  { phone: '9333344455', label: 'reuse blocked' },
  { phone: '9111122233', label: 'resend' }
]

const results = []
const record = (num, name, state, detail) => {
  results.push({ num, name, state })
  const icon = { pass: '✅', fail: '❌', blocked: '⏭️' }[state]
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ''}`)
}

const call = async (path, body) => {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  const raw = await res.text()
  let data
  try { data = JSON.parse(raw) } catch { data = { message: raw } }
  return { status: res.status, data }
}

const opts = (phone) => ({ identifier: toE164(phone), channel: 'sms', purpose: 'login' })

// Clear any state left by an earlier run so each case starts clean.
const wipe = async (phone) => {
  await otpService.clearOtp(opts(phone))
}

const run = async () => {
  const sms = providerStatus()

  console.log('\n═══════════════════════════════════════════════════════')
  console.log('  OTP VERIFICATION — MULTIPLE MOBILE NUMBERS')
  console.log('═══════════════════════════════════════════════════════')
  console.log(`API      : ${BASE}`)
  console.log(`SMS      : ${sms.provider} · live=${sms.live}${sms.reason ? ` (${sms.reason})` : ''}`)
  console.log(`Policy   : ${JSON.stringify(otpService.otpConfig())}\n`)

  // Reachability check first, so failures are not misread as logic errors.
  try {
    const ping = await fetch(BASE.replace('/api/v1', '') + '/health')
    if (!ping.ok) throw new Error(`HTTP ${ping.status}`)
  } catch (err) {
    console.error(`Cannot reach the API at ${BASE} — start the server first. (${err.message})\n`)
    process.exit(1)
  }

  // Rate-limit-only mode: run against a server using production defaults.
  if (process.env.RATE_LIMIT_ONLY === '1') {
    console.log('── Per-IP rate limiting only ──')
    const limit = parseInt(process.env.RATE_LIMIT_OTP_MAX, 10) || 5
    let sawRateLimit = false, calls = 0
    for (let i = 0; i < limit + 6; i++) {
      const r = await call('/auth/send-otp', { phone: `98${String(700000000 + i).slice(0, 8)}` })
      calls++
      if (r.status === 429 && r.data?.code === 'RATE_LIMITED') { sawRateLimit = true; break }
    }
    record('ip', `per-IP limiter trips (limit ${limit})`, sawRateLimit ? 'pass' : 'fail',
      sawRateLimit ? `429 RATE_LIMITED on call ${calls}` : `no 429 after ${calls} calls`)
    console.log(`\n  ${sawRateLimit ? '1 passed · 0 failed' : '0 passed · 1 failed'}\n`)
    process.exit(sawRateLimit ? 0 : 1)
  }

  // ── 1. Delivery ────────────────────────────────────────────────
  console.log('── 1. SMS delivery ──')
  for (const { phone } of NUMBERS.slice(0, 5)) {
    await wipe(phone)
    const res = await call('/auth/send-otp', { phone })

    if (sms.live) {
      const ok = res.status === 200 && res.data?.success === true && res.data?.data?.delivered === true
      record(phone, `${phone} · delivery`, ok ? 'pass' : 'fail',
        ok ? `sent to ${res.data.data.maskedPhone}` : `HTTP ${res.status} ${res.data?.code || ''} ${res.data?.message || ''}`)
    } else {
      // Without credentials the only correct behaviour is an explicit 503.
      const honest = res.status === 503 && res.data?.code === 'SMS_NOT_CONFIGURED' && res.data?.success === false
      record(phone, `${phone} · delivery`, honest ? 'blocked' : 'fail',
        honest
          ? 'correctly refused (503 SMS_NOT_CONFIGURED) — no Twilio credentials'
          : `expected 503 SMS_NOT_CONFIGURED, got HTTP ${res.status} ${JSON.stringify(res.data)}`)
    }
  }

  // ── 2. Successful login ────────────────────────────────────────
  console.log('\n── 2. Correct code → login ──')
  for (const { phone } of NUMBERS.slice(0, 5)) {
    await wipe(phone)
    const { otp } = await otpService.issueOtp(opts(phone))
    const res = await call('/auth/verify-otp', { phone, otp })
    const ok = res.status === 200 && res.data?.success === true && !!res.data?.data?.token
    record(phone, `${phone} · login`, ok ? 'pass' : 'fail',
      ok ? `JWT issued for ${res.data.data.user.phone}` : `HTTP ${res.status} ${res.data?.code || res.data?.message}`)
  }

  // ── 3. Incorrect code ──────────────────────────────────────────
  console.log('\n── 3. Incorrect code ──')
  for (const { phone } of NUMBERS.slice(0, 5)) {
    await wipe(phone)
    const { otp } = await otpService.issueOtp(opts(phone))
    const wrong = String((Number(otp) + 1) % 1000000).padStart(6, '0')

    const bad = await call('/auth/verify-otp', { phone, otp: wrong })
    const rejected = bad.status === 400 && bad.data?.code === 'OTP_INVALID'

    // The correct code must still work after a failed attempt.
    const good = await call('/auth/verify-otp', { phone, otp })
    const recovers = good.status === 200 && !!good.data?.data?.token

    record(phone, `${phone} · wrong code rejected, correct still works`,
      rejected && recovers ? 'pass' : 'fail',
      `${bad.data?.code} (${bad.data?.attemptsRemaining} left) → then ${recovers ? 'login OK' : 'login FAILED'}`)
  }

  // ── 4. Expiry ──────────────────────────────────────────────────
  console.log('\n── 4. Expiry ──')
  for (const { phone } of NUMBERS.slice(0, 5)) {
    await wipe(phone)
    const { otp } = await otpService.issueOtp(opts(phone))
    const key = `login_sms_${toE164(phone)}`
    await db.collection('otps').doc(key).update({ expiresAt: new Date(Date.now() - 1000).toISOString() })

    const res = await call('/auth/verify-otp', { phone, otp })
    const ok = res.status === 400 && res.data?.code === 'OTP_EXPIRED'
    record(phone, `${phone} · expired code rejected`, ok ? 'pass' : 'fail', res.data?.code)
  }

  // ── 5. Reuse ───────────────────────────────────────────────────
  console.log('\n── 5. Reuse of a consumed code ──')
  for (const { phone } of NUMBERS.slice(0, 5)) {
    await wipe(phone)
    const { otp } = await otpService.issueOtp(opts(phone))
    const first = await call('/auth/verify-otp', { phone, otp })
    const second = await call('/auth/verify-otp', { phone, otp })
    const ok = first.status === 200 && second.status === 400
    record(phone, `${phone} · code works once only`, ok ? 'pass' : 'fail',
      `1st ${first.status} → 2nd ${second.status} ${second.data?.code}`)
  }

  // ── 6. Attempt cap ─────────────────────────────────────────────
  console.log('\n── 6. Attempt cap ──')
  const maxAttempts = otpService.otpConfig().maxAttempts
  for (const { phone } of NUMBERS.slice(0, 5)) {
    await wipe(phone)
    const { otp } = await otpService.issueOtp(opts(phone))
    let lastCode = ''
    for (let i = 0; i < maxAttempts + 1; i++) {
      const r = await call('/auth/verify-otp', { phone, otp: '000000' })
      lastCode = r.data?.code
    }
    // Once capped, even the genuine code must fail.
    const genuine = await call('/auth/verify-otp', { phone, otp })
    const ok = ['OTP_TOO_MANY_ATTEMPTS', 'OTP_NOT_FOUND'].includes(lastCode) && genuine.status === 400
    record(phone, `${phone} · locks out after ${maxAttempts} wrong attempts`, ok ? 'pass' : 'fail',
      `${lastCode}; genuine code then ${genuine.data?.code}`)
  }

  // ── 7. Resend cooldown ─────────────────────────────────────────
  console.log('\n── 7. Resend cooldown (per number) ──')
  const cooldown = otpService.otpConfig().resendCooldownSeconds
  for (const { phone } of NUMBERS.slice(0, 5)) {
    await wipe(phone)
    await otpService.issueOtp(opts(phone))
    let blocked = false, wait = null
    try {
      await otpService.issueOtp(opts(phone))
    } catch (err) {
      blocked = err.code === 'EOTPCOOLDOWN'
      wait = err.retryAfter
    }
    record(phone, `${phone} · resend blocked for ${cooldown}s`, blocked ? 'pass' : 'fail',
      blocked ? `retryAfter=${wait}s` : 'second issue was allowed immediately')
  }

  // ── 8. Hourly send cap ─────────────────────────────────────────
  console.log('\n── 8. Hourly send cap (per number) ──')
  const perHour = otpService.otpConfig().maxSendsPerHour
  {
    const phone = NUMBERS[5].phone
    await wipe(phone)
    let throttled = false, sends = 0
    for (let i = 0; i < perHour + 2; i++) {
      try {
        await otpService.issueOtp(opts(phone))
        sends++
        // Step past the cooldown without waiting in real time.
        await db.collection('otps').doc(`login_sms_${toE164(phone)}`)
          .update({ lastSentAt: new Date(Date.now() - 60_000).toISOString() })
      } catch (err) {
        if (err.code === 'EOTPTHROTTLE') { throttled = true; break }
      }
    }
    record(phone, `${phone} · capped at ${perHour} sends/hour`, throttled ? 'pass' : 'fail',
      `${sends} sends allowed, then ${throttled ? 'throttled' : 'NOT throttled'}`)
    await wipe(phone)
  }

  // ── 9. HTTP rate limiting ──────────────────────────────────────
  // The per-IP limiter counts every OTP call, so the functional cases above
  // need a widened limit to run at all. Assert the limiter against a server
  // started with production defaults instead: RATE_LIMIT_ONLY=1.
  console.log('\n── 9. Per-IP rate limiting on /auth/send-otp ──')
  {
    const limit = parseInt(process.env.RATE_LIMIT_OTP_MAX, 10) || 5
    if (limit > 20) {
      console.log(`  ⏭️  Skipped — this server runs a widened limit (${limit}).`)
      console.log('      Assert it separately: RATE_LIMIT_ONLY=1 npm run test:otp')
    } else {
      let sawRateLimit = false, calls = 0
      for (let i = 0; i < limit + 4; i++) {
        const r = await call('/auth/send-otp', { phone: `98${String(700000000 + i).slice(0, 8)}` })
        calls++
        if (r.status === 429 && r.data?.code === 'RATE_LIMITED') { sawRateLimit = true; break }
      }
      record('ip', `per-IP limiter trips within ${limit + 4} calls`, sawRateLimit ? 'pass' : 'fail',
        sawRateLimit ? `429 RATE_LIMITED after ${calls} calls` : `no 429 after ${calls} calls`)
    }
  }

  // ── 10. Input validation ───────────────────────────────────────
  console.log('\n── 10. Invalid numbers rejected ──')
  for (const bad of ['123', 'abcdefghij', '', '99999']) {
    const r = await call('/auth/verify-otp', { phone: bad, otp: '123456' })
    const ok = r.status === 400
    record(bad || '(empty)', `"${bad || '(empty)'}" rejected`, ok ? 'pass' : 'fail', `HTTP ${r.status} ${r.data?.code || ''}`)
  }

  // Leave no live codes behind.
  for (const { phone } of NUMBERS) await wipe(phone)

  // ── Summary ────────────────────────────────────────────────────
  const pass = results.filter(r => r.state === 'pass').length
  const fail = results.filter(r => r.state === 'fail').length
  const blocked = results.filter(r => r.state === 'blocked').length

  console.log('\n═══════════════════════════════════════════════════════')
  console.log(`  ${pass} passed · ${fail} failed · ${blocked} blocked`)
  if (fail) {
    console.log('\n  Failures:')
    results.filter(r => r.state === 'fail').forEach(r => console.log(`    ✗ ${r.name}`))
  }
  if (blocked) {
    console.log('\n  Blocked (needs Twilio credentials in .env):')
    results.filter(r => r.state === 'blocked').forEach(r => console.log(`    ⏭️  ${r.name}`))
  }
  console.log('═══════════════════════════════════════════════════════\n')

  process.exit(fail ? 1 : 0)
}

run().catch(err => {
  console.error('\n💥 Test run crashed:', err)
  process.exit(1)
})
