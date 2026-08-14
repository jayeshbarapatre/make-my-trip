import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config'
import { messageForRequestError } from './apiError'

// These modules live outside /admin — they are shared RBAC endpoints that also
// serve customers and vendors. The admin panel reaches them with the same
// adminToken, which the backend now resolves through the unified user store.
const platformAPI = axios.create({
  baseURL: API_BASE_URL,
  // This instance carried no timeout at all, so an unanswered admin request
  // spun until the browser gave up on its own.
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' }
})

platformAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

platformAPI.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const error = new Error(messageForRequestError(err, 'Request failed'))
    error.status = err.response?.status
    error.code = err.response?.data?.code
    return Promise.reject(error)
  }
)

export const reportsService = {
  summary: (params) => platformAPI.get('/reports/summary', { params }),
  get: (kind, params) => platformAPI.get(`/reports/${kind}`, { params }),

  // Exports are binary/text downloads, so they bypass the JSON interceptor.
  download: async (kind, format, params = {}) => {
    const token = localStorage.getItem('adminToken')
    const qs = new URLSearchParams({ ...params, format }).toString()

    const res = await fetch(`${API_BASE_URL}/reports/${kind}?${qs}`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      let message = 'Export failed'
      try {
        message = (await res.json()).message || message
      } catch {
        // Non-JSON error body; keep the generic message.
      }
      throw new Error(message)
    }

    const blob = await res.blob()
    const disposition = res.headers.get('Content-Disposition') || ''
    const suggested = /filename="([^"]+)"/.exec(disposition)?.[1]

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = suggested || `${kind}-report.${format}`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }
}

export const refundsAdminService = {
  list: (status) => platformAPI.get('/refunds/all', { params: status ? { status } : {} }),
  act: (id, action, note) => platformAPI.patch(`/refunds/${id}/${action}`, { note })
}

export const supportAdminService = {
  list: (status) => platformAPI.get('/support/tickets/all', { params: status ? { status } : {} }),
  get: (id) => platformAPI.get(`/support/tickets/${id}`),
  reply: (id, message) => platformAPI.post(`/support/tickets/${id}/reply`, { message }),
  setStatus: (id, status) => platformAPI.patch(`/support/tickets/${id}/status`, { status })
}

export const couponsAdminService = {
  list: () => platformAPI.get('/coupons'),
  save: (data) => platformAPI.post('/coupons', data),
  remove: (code) => platformAPI.delete(`/coupons/${code}`)
}

export const vendorRequestsService = {
  list: (status) => platformAPI.get('/vendor-requests', { params: status ? { status } : {} }),
  decide: (id, decision, note) => platformAPI.patch(`/vendor-requests/${id}/${decision}`, { note })
}

// Approved vendors, as opposed to the applications above. `toggle` flips the
// account between active and suspended; the backend also pulls a suspended
// vendor's inventory off sale, so this is not a cosmetic flag.
export const vendorsAdminService = {
  list: () => platformAPI.get('/admin/vendors'),
  toggle: (id) => platformAPI.patch(`/admin/vendors/${id}/toggle`),
  remove: (id) => platformAPI.delete(`/admin/vendors/${id}`)
}

export default platformAPI
