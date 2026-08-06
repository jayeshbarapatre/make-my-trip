import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * The /flights page could never find a flight — for any route, on any date —
 * because it read the response one level too deep:
 *
 *   const response = await api.get('/flights', ...)
 *   if (response.data.data && response.data.data.length > 0)
 *
 * The interceptor in services/api.js is `(res) => res.data`, so `response` is
 * already the body. `response.data.data` was undefined on every call and the
 * page reported "No flights found" every time.
 *
 * This is a static check rather than a runtime one because the defect is a
 * misreading of a contract, and it is invisible at runtime: the page renders
 * happily and simply always takes the empty branch.
 */
// vitest runs from the package root, so this is stable on any platform.
const SRC = resolve(process.cwd(), 'src')

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const full = join(dir, e.name)
  if (e.isDirectory()) return walk(full)
  return /\.jsx?$/.test(e.name) && !/\.test\.jsx?$/.test(e.name) ? [full] : []
})

describe('the api interceptor contract', () => {
  it('unwraps to the body, so callers must not read .data.data', () => {
    const api = readFileSync(join(SRC, 'services', 'api.js'), 'utf8')
    // If this assertion ever fails the interceptor changed, and the rule below
    // no longer holds — update both together.
    expect(api).toMatch(/\(res\)\s*=>\s*res\.data/)
  })

  // Comments are stripped first: the call sites that were fixed explain the
  // mistake in prose, and matching that prose would fail the check forever.
  const stripComments = (src) => src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')

  it('no module that imports `api` reads response.data.data', () => {
    const offenders = []
    for (const file of walk(SRC)) {
      const src = readFileSync(file, 'utf8')
      const usesApi = /from ['"][^'"]*services\/api['"]/.test(src)
      if (usesApi && /\.data\.data\b/.test(stripComments(src))) {
        offenders.push(file.replace(SRC, ''))
      }
    }
    expect(offenders).toEqual([])
  })
})
