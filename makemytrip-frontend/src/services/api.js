import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
})

// Access tokens are now short-lived and revocable, so a 401 is an ordinary
// event mid-session rather than a dead end. This interceptor exchanges the
// refresh token for a new pair and replays the original request, so the
// shorter lifetime is invisible to the user.
//
// A single in-flight refresh is shared by every request that 401s at once —
// otherwise a page issuing six parallel calls would fire six refreshes, and
// because refresh tokens rotate, five of them would be rejected and the user
// would be signed out mid-session.
let refreshInFlight = null

export const clearSession = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}

const runRefresh = async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')

  // Deliberately a bare axios call: routing this through `api` would recurse
  // back into this same interceptor when the refresh itself fails.
  const { data } = await axios.post(
    `${API_BASE_URL}/auth/refresh`,
    { refreshToken },
    { timeout: API_TIMEOUT }
  )

  const next = data?.data
  if (!next?.token) throw new Error('Refresh returned no token')

  localStorage.setItem('token', next.token)
  if (next.refreshToken) localStorage.setItem('refreshToken', next.refreshToken)
  if (next.user) localStorage.setItem('user', JSON.stringify(next.user))

  return next.token
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    const status = err.response?.status
    const original = err.config

    // Only an expired or revoked credential is retryable, and only once —
    // `_retry` stops a genuinely unauthorised request from looping.
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true

      try {
        refreshInFlight = refreshInFlight || runRefresh().finally(() => { refreshInFlight = null })
        const token = await refreshInFlight

        original.headers = { ...original.headers, Authorization: `Bearer ${token}` }
        return api(original)
      } catch {
        // The session is genuinely over: the refresh token is missing, expired
        // or revoked. Drop the local copy so the UI stops presenting the user
        // as signed in, and let the app react.
        clearSession()
        window.dispatchEvent(new CustomEvent('auth:session-expired'))
      }
    }

    const message = err.response?.data?.message || err.message || 'An error occurred'
    const error = new Error(message)
    error.status = status || 500
    error.code = err.response?.data?.code
    error.response = {
      data: err.response?.data,
      status: err.response?.status
    }
    return Promise.reject(error)
  }
)

export default api
