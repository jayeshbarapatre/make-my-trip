/**
 * Vercel serverless entry point.
 *
 * `src/index.js` builds the Express app and, when it owns a process, listens on
 * a port. Here the platform owns the process, so this module drives
 * initialisation itself and hands each request to the same app.
 *
 * ── Read this before deploying the API here ──
 *
 * Vercel works, but it is a worse fit for this backend than Render (already
 * configured in `render.yaml`), for three reasons that are properties of
 * serverless rather than bugs:
 *
 * 1. **Rate limiting degrades.** Redis is unreachable, so the limiters in
 *    `middleware/rateLimiter.js` fall back to in-memory counters. One process
 *    means one bucket; N concurrent lambdas mean N buckets, and the effective
 *    auth brute-force limit is multiplied by however many instances Vercel
 *    happens to be running. Provision Redis (`REDIS_URL`) before serving real
 *    traffic from here — on Render's single starter instance the fallback is
 *    merely imperfect; here it is close to absent.
 *
 * 2. **The search cache stops working.** `node-cache` is per-instance, so a
 *    warm entry helps only the lambda that created it. Every cold instance
 *    re-reads Firestore. This project has exhausted its daily Firestore quota
 *    once already.
 *
 * 3. **The error reporter throttles per instance.** `errorReporter` collapses
 *    repeated failures to one write per fingerprint per minute using an
 *    in-process Map, so N instances write N times.
 *
 * ── The webhook needs checking on first deploy ──
 *
 * `POST /api/v1/payment/webhook` verifies an HMAC over the exact bytes Razorpay
 * sent, which is why `src/index.js` mounts `express.raw` ahead of
 * `express.json`. Some versions of Vercel's Node runtime parse the request body
 * before the handler sees it; a parsed-and-restringified body does not
 * reproduce those bytes and every signature would fail.
 *
 * The handler already refuses to guess — it returns 500 "Webhook
 * misconfigured" when `req.body` is not a Buffer, rather than silently
 * rejecting deliveries as forgeries. Send one test delivery from the Razorpay
 * dashboard after the first deploy and confirm it is accepted. `npm run
 * verify:payment` will NOT catch this: it calls the handler directly and never
 * crosses the platform's request pipeline.
 */

import app, { initializeApp } from '../src/index.js'

// Memoised so routes, middleware and the Firebase Admin SDK are registered once
// per cold start rather than once per request. Concurrent requests arriving
// during a cold start all await the same promise.
let ready = null

export default async function handler (req, res) {
  try {
    ready ??= initializeApp()
    await ready
  } catch (err) {
    // A failed secret or trust-proxy check must not be retried forever against
    // a permanently broken deployment — but it also must not be cached as
    // "started", or every later request would 404 on a half-registered app.
    ready = null
    console.error('❌ Serverless initialisation failed:', err.message)
    return res.status(503).json({
      success: false,
      message: 'The service is starting up or misconfigured. Please try again shortly.'
    })
  }

  return app(req, res)
}
