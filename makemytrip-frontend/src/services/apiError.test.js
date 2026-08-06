import { describe, it, expect } from 'vitest'
import { messageForRequestError } from './apiError'

// A first-time visitor was shown "timeout of 10000ms exceeded" on the sign-up
// form: axios's own transport string, rendered verbatim, because every call site
// falls back to err.message when the response carries no body — and a request
// that never completed has no body by definition.
describe('messageForRequestError', () => {
  const LEAKS = /timeout of \d+ms|Network Error|ECONNABORTED|ERR_NETWORK|undefined|\[object/

  it('never returns an axios transport string', () => {
    const shapes = [
      { code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' },
      { code: 'ETIMEDOUT', message: 'timeout' },
      { code: 'ERR_NETWORK', message: 'Network Error' },
      { message: 'Request failed with status code 500', response: { status: 500, data: {} } },
      { response: { status: 400, data: {} } },
      {},
      null,
      undefined
    ]
    for (const err of shapes) {
      expect(messageForRequestError(err)).not.toMatch(LEAKS)
    }
  })

  it('prefers the server message whenever there is one', () => {
    const err = { response: { status: 409, data: { message: 'An account with this email already exists.' } } }
    expect(messageForRequestError(err)).toBe('An account with this email already exists.')
  })

  it('keeps the server message even on a 5xx', () => {
    const err = { response: { status: 500, data: { message: 'Registration failed. Please try again.' } } }
    expect(messageForRequestError(err)).toBe('Registration failed. Please try again.')
  })

  it('explains a timeout in words a customer can act on', () => {
    const msg = messageForRequestError({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' })
    expect(msg).toMatch(/too long/i)
  })

  it('distinguishes an unreachable server from a slow one', () => {
    expect(messageForRequestError({ code: 'ERR_NETWORK' })).toMatch(/could not reach/i)
  })

  it('uses the caller fallback when nothing else applies', () => {
    expect(messageForRequestError({ response: { status: 400, data: {} } }, 'Could not save')).toBe('Could not save')
  })
})
