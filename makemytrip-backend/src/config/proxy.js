// Trust-proxy resolution.
//
// Express defaults `trust proxy` to false, so `req.ip` is the TCP peer address.
// Behind any reverse proxy that peer is the proxy itself, which means every
// client collapses into a single rate-limit bucket: the 11th login attempt
// platform-wide would be rejected, while an attacker rotating source addresses
// would never be counted separately.
//
// The fix is NOT `app.set('trust proxy', true)`. That makes Express believe the
// left-most X-Forwarded-For entry, which is attacker-controlled — anyone can
// send `X-Forwarded-For: 1.2.3.4` and mint a fresh rate-limit bucket per
// request. express-rate-limit rejects that setting outright with
// ERR_ERL_PERMISSIVE_TRUST_PROXY.
//
// What is safe is a hop COUNT that matches the real topology. Express then
// counts n entries in from the right of X-Forwarded-For, and everything to the
// left — the part a client can forge — is ignored.

/**
 * Hop counts for the managed platforms this service is deployed behind.
 * Each value is the number of proxies that append to X-Forwarded-For between
 * the public internet and this process.
 */
const PLATFORM_HOPS = {
  // deploy/nginx/nginx.conf -> backend:5000
  nginx: 1,
  // Cloudflare terminating straight onto the origin.
  cloudflare: 1,
  // Cloudflare -> your own nginx -> app.
  'cloudflare-nginx': 2,
  render: 1,
  railway: 1,
  heroku: 1,
  // Application Load Balancer / CloudFront single origin.
  aws: 1,
  'aws-alb': 1,
  // CloudFront -> ALB -> app.
  'aws-cloudfront-alb': 2,
  // App Service / Front Door.
  azure: 1,
  'azure-frontdoor': 2,
  digitalocean: 1,
  do: 1,
  gcp: 1,
  'gcp-lb': 1
}

/** Express's own named presets, passed through untouched. */
const EXPRESS_PRESETS = new Set(['loopback', 'linklocal', 'uniquelocal'])

const DISABLED = new Set(['', 'false', 'off', 'none', 'direct', 'no', '0'])

const looksLikeIpOrCidr = (value) =>
  // IPv4, IPv4/CIDR, or anything containing a colon (IPv6, with or without /len).
  /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(value) || value.includes(':')

const configError = (message) => {
  const err = new Error(message)
  err.code = 'ETRUSTPROXY'
  return err
}

/**
 * Translates the TRUST_PROXY environment variable into an Express
 * `trust proxy` value.
 *
 * Accepted forms:
 *   (unset) | false | none | direct | 0   no proxy; req.ip is the peer address
 *   1 | 2 | n                             trust n hops (the usual answer)
 *   nginx | cloudflare | render | ...     named platform, resolved to a hop count
 *   loopback | linklocal | uniquelocal    Express's built-in presets
 *   10.0.0.0/8, 192.168.1.5               explicit proxy addresses / CIDRs
 *
 * Deliberately rejected:
 *   true | all                            trivially spoofable; see module header
 *
 * Pure — reads only the value passed in, so it is directly testable.
 *
 * @param {string|undefined} raw            value of process.env.TRUST_PROXY
 * @param {{isProduction?: boolean}} [opts]
 * @returns {{ value: false|number|string|string[], description: string, warnings: string[] }}
 * @throws {Error} with code ETRUSTPROXY when the value cannot be trusted
 */
export const resolveTrustProxy = (raw, { isProduction = false } = {}) => {
  const warnings = []
  const input = String(raw ?? '').trim()
  const normalized = input.toLowerCase()

  if (DISABLED.has(normalized)) {
    if (isProduction) {
      warnings.push(
        'TRUST_PROXY is not set. If this service runs behind nginx, Cloudflare, a load balancer ' +
        'or a PaaS router, every client shares one rate-limit bucket and per-IP limits do not work. ' +
        'Set TRUST_PROXY to the number of proxies in front of it (usually 1).'
      )
    }
    return { value: false, description: 'disabled (direct connections; req.ip is the peer address)', warnings }
  }

  // The whole point of this module: never let a deployment opt into the
  // spoofable setting, however it is spelled.
  if (normalized === 'true' || normalized === 'all' || normalized === '*') {
    throw configError(
      `TRUST_PROXY="${input}" is not permitted. Trusting every proxy makes the client-supplied ` +
      'X-Forwarded-For header authoritative, letting anyone forge a source address and bypass ' +
      'rate limiting. Set the number of proxies in front of this service instead (e.g. TRUST_PROXY=1).'
    )
  }

  if (EXPRESS_PRESETS.has(normalized)) {
    return { value: normalized, description: `Express preset "${normalized}"`, warnings }
  }

  if (Object.hasOwn(PLATFORM_HOPS, normalized)) {
    const hops = PLATFORM_HOPS[normalized]
    return { value: hops, description: `${normalized} (${hops} proxy hop${hops === 1 ? '' : 's'})`, warnings }
  }

  if (/^\d+$/.test(normalized)) {
    const hops = Number.parseInt(normalized, 10)
    if (hops > 10) {
      throw configError(
        `TRUST_PROXY=${hops} is implausible — that many proxies would mean ignoring almost the ` +
        'entire X-Forwarded-For chain. Count the proxies that actually append to the header.'
      )
    }
    return { value: hops, description: `${hops} proxy hop${hops === 1 ? '' : 's'}`, warnings }
  }

  // Explicit proxy addresses. Every entry must parse, otherwise a typo would
  // silently narrow the trusted set and break client-IP resolution.
  if (input.includes(',') || looksLikeIpOrCidr(input)) {
    const entries = input.split(',').map((s) => s.trim()).filter(Boolean)
    const invalid = entries.filter((e) => !looksLikeIpOrCidr(e))

    if (invalid.length) {
      throw configError(
        `TRUST_PROXY contains ${invalid.length} entry/entries that are not an IP address or CIDR range: ` +
        `${invalid.join(', ')}. Use a hop count, a platform name, or a comma-separated list of proxy addresses.`
      )
    }
    return { value: entries, description: `${entries.length} trusted proxy address(es)`, warnings }
  }

  throw configError(
    `TRUST_PROXY="${input}" is not a recognised value. Use a hop count (1), a platform name ` +
    `(${Object.keys(PLATFORM_HOPS).join(', ')}), an Express preset (loopback, linklocal, uniquelocal), ` +
    'or a comma-separated list of proxy IPs/CIDRs.'
  )
}

/**
 * Applies the resolved setting to an Express app and reports it.
 *
 * Called before any rate limiter runs, because express-rate-limit reads
 * `req.ip` — which is only correct once this is set.
 *
 * @param {import('express').Express} app
 * @param {{isProduction?: boolean, env?: NodeJS.ProcessEnv}} [opts]
 */
export const applyTrustProxy = (app, { isProduction = false, env = process.env } = {}) => {
  const resolved = resolveTrustProxy(env.TRUST_PROXY, { isProduction })

  app.set('trust proxy', resolved.value)

  for (const warning of resolved.warnings) {
    console.warn(`⚠️  Trust proxy: ${warning}`)
  }
  console.log(`🛡️  Trust proxy: ${resolved.description}`)

  return resolved
}

export const PLATFORM_PRESETS = Object.freeze({ ...PLATFORM_HOPS })

export default { resolveTrustProxy, applyTrustProxy, PLATFORM_PRESETS }
