/**
 * Turns a failed request into something a customer can act on.
 *
 * axios reports transport failures as engineering strings on `err.message` —
 * "timeout of 10000ms exceeded", "Network Error". Every call site in the app
 * falls back to `err.message` when the response carries no body, and a request
 * that never completed has no body by definition. So the one case where the
 * user most needs a plain explanation is exactly the case that produced the
 * rawest possible string, on the sign-up form, to a first-time visitor.
 *
 * The server's own message always wins when there is one: it is the only party
 * that knows what actually went wrong. This only covers the failures that never
 * reached it.
 */
export const messageForRequestError = (
  err,
  fallback = 'Something went wrong. Please try again.'
) => {
  const fromServer = err?.response?.data?.message
  if (fromServer) return fromServer

  // axios sets ECONNABORTED for its own timeout; ERR_CANCELED is a caller abort.
  if (err?.code === 'ECONNABORTED' || err?.code === 'ETIMEDOUT') {
    return 'The server took too long to respond. Please try again in a moment.'
  }

  if (err?.code === 'ERR_NETWORK') {
    return 'Could not reach the server. Check your internet connection and try again.'
  }

  if (err?.response?.status >= 500) {
    return 'The server ran into a problem. Please try again in a moment.'
  }

  return fallback
}

export default messageForRequestError
