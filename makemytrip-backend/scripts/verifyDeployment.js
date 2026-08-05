/**
 * Checks whether a DEPLOYED backend is actually serving this codebase.
 *
 * Written because `/health` returning 200 fooled us. That route is registered
 * at module scope, before `initializeApp()` mounts anything else — so a build
 * whose initialisation failed, or a stale build from months ago, still answers
 * `/health` cheerfully while every real endpoint 404s. "The health check is
 * green" is not evidence that the API works.
 *
 * The checks below are ordered so the first failure tells you what to fix:
 *
 *   1. reachable        — DNS, TLS, the platform is routing to something
 *   2. current build    — security headers set at module scope. Missing means
 *                         the deploy is stale, whatever the status code says
 *   3. routes mounted   — a real endpoint answers. Express's own
 *                         "Cannot GET /x" means initializeApp() never finished
 *   4. CORS             — the browser origin you actually serve is allowed
 *
 *   npm run verify:deploy -- https://api.example.com
 *   npm run verify:deploy -- https://api.example.com --origin https://app.example.com
 */

const args = process.argv.slice(2)
const base = (args.find((a) => a.startsWith('http')) ?? '').replace(/\/+$/, '')
const originFlag = args.indexOf('--origin')
const origin = originFlag !== -1 ? args[originFlag + 1] : null

if (!base) {
  console.error('\nUsage: npm run verify:deploy -- https://your-backend-host [--origin https://your-frontend]\n')
  process.exit(1)
}

const banner = (t) => console.log('\n' + '='.repeat(72) + '\n' + t + '\n' + '='.repeat(72))

let pass = 0
let fail = 0
const problems = []

const check = (name, ok, detail = '') => {
  if (ok) { pass++; console.log(`  ok    ${name}`); return true }
  fail++
  problems.push(`${name}${detail ? ' — ' + detail : ''}`)
  console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`)
  return false
}

const get = async (path, headers = {}) => {
  try {
    const res = await fetch(`${base}${path}`, { headers, redirect: 'manual' })
    return { status: res.status, headers: res.headers, body: await res.text() }
  } catch (err) {
    return { status: 0, headers: new Headers(), body: '', error: err.message }
  }
}

const main = async () => {
  banner(`DEPLOYMENT VERIFICATION — ${base}`)

  // 1. Reachable at all.
  const health = await get('/health')
  if (!check('the host is reachable', health.status !== 0, health.error)) {
    banner('ABORTED — nothing answered. Check the URL and that the service is running.')
    return false
  }
  check('/health responds', health.status === 200, `HTTP ${health.status}`)

  // 2. Is this actually the current build?
  //
  // These are set at module scope in src/index.js, so they appear on EVERY
  // response — including 404s — as long as the deployed code is this codebase.
  console.log('\n  build identity')
  const secHeaders = ['x-content-type-options', 'x-frame-options', 'referrer-policy']
  const present = secHeaders.filter((h) => health.headers.get(h))
  const currentBuild = check(
    'security headers are present (proves the deployed code is this codebase)',
    present.length === secHeaders.length,
    present.length ? `only ${present.join(', ')}` : 'none present — the deploy is STALE'
  )

  // 3. Did initializeApp() finish? This is the check /health cannot make.
  console.log('\n  route mounting')
  const flights = await get('/api/v1/flights')

  const expressDefault404 = /Cannot (GET|POST)/.test(flights.body)
  check(
    'API routes are mounted',
    !expressDefault404,
    expressDefault404
      ? "Express's built-in 404 — initializeApp() never finished, so no routes registered"
      : ''
  )
  check(
    '/api/v1/flights answers',
    flights.status === 200,
    `HTTP ${flights.status}${flights.status === 404 ? ' (see above)' : ''}`
  )

  // A JSON body proves the app's own handlers are in play, not the platform's.
  const isJson = (health.headers.get('content-type') ?? '').includes('json')
  check('/health is served by the app, not the platform', isJson,
    `content-type: ${health.headers.get('content-type') ?? 'none'}`)

  // 4. Will a browser be allowed to call this?
  if (origin) {
    console.log(`\n  CORS for ${origin}`)
    const cors = await get('/api/v1/flights', { Origin: origin })
    const allowed = cors.headers.get('access-control-allow-origin')

    check('the frontend origin is allowed', allowed === origin,
      allowed ? `server allows "${allowed}"` : 'no access-control-allow-origin — the browser will report "Network Error"')
  } else {
    console.log('\n  (pass --origin https://your-frontend to check CORS too)')
  }

  banner(fail === 0 ? `DEPLOYMENT OK — ${pass} checks` : `DEPLOYMENT BROKEN — ${fail} of ${pass + fail}`)
  problems.forEach((p) => console.log('  ✗ ' + p))

  if (!currentBuild) {
    console.log('\n  The stale-build failure is the one to fix first: the platform is')
    console.log('  serving an old deploy, so nothing you change in the code will')
    console.log('  appear until a fresh deploy succeeds. Check the build logs.')
  }

  return fail === 0
}

main()
  .then((ok) => process.exit(ok ? 0 : 1))
  .catch((err) => { console.error('verify:deploy crashed:', err); process.exit(1) })
