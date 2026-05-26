import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const adminAPI = axios.create({
  baseURL: `${API_BASE_URL}/admin`,
  headers: { 'Content-Type': 'application/json' }
})

adminAPI.interceptors.request.use(config => {
  const token = localStorage.getItem('adminToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const adminAuthService = {
  register: (data) => adminAPI.post('/register', data),
  login: (email, password) => adminAPI.post('/login', { email, password }),
  getProfile: () => adminAPI.get('/profile'),
  logout: () => adminAPI.post('/logout'),
  changePassword: (currentPassword, newPassword) => adminAPI.put('/change-password', { currentPassword, newPassword })
}

export const adminFlightsService = {
  getAll: (params) => adminAPI.get('/flights', { params }),
  getById: (id) => adminAPI.get(`/flights/${id}`),
  create: (data) => adminAPI.post('/flights', data),
  update: (id, data) => adminAPI.put(`/flights/${id}`, data),
  delete: (id) => adminAPI.delete(`/flights/${id}`),
  toggleStatus: (id) => adminAPI.patch(`/flights/${id}/toggle`)
}

export const adminHotelsService = {
  getAll: (params) => adminAPI.get('/hotels', { params }),
  getById: (id) => adminAPI.get(`/hotels/${id}`),
  create: (data) => adminAPI.post('/hotels', data),
  update: (id, data) => adminAPI.put(`/hotels/${id}`, data),
  delete: (id) => adminAPI.delete(`/hotels/${id}`),
  toggleStatus: (id) => adminAPI.patch(`/hotels/${id}/toggle`)
}

export const adminBusesService = {
  getAll: (params) => adminAPI.get('/buses', { params }),
  getById: (id) => adminAPI.get(`/buses/${id}`),
  create: (data) => adminAPI.post('/buses', data),
  update: (id, data) => adminAPI.put(`/buses/${id}`, data),
  delete: (id) => adminAPI.delete(`/buses/${id}`),
  toggleStatus: (id) => adminAPI.patch(`/buses/${id}/toggle`)
}

export const adminCabsService = {
  getAll: (params) => adminAPI.get('/cabs', { params }),
  getById: (id) => adminAPI.get(`/cabs/${id}`),
  create: (data) => adminAPI.post('/cabs', data),
  update: (id, data) => adminAPI.put(`/cabs/${id}`, data),
  delete: (id) => adminAPI.delete(`/cabs/${id}`),
  toggleStatus: (id) => adminAPI.patch(`/cabs/${id}/toggle`)
}

export const adminTrainsService = {
  getAll: (params) => adminAPI.get('/trains', { params }),
  getById: (id) => adminAPI.get(`/trains/${id}`),
  create: (data) => adminAPI.post('/trains', data),
  update: (id, data) => adminAPI.put(`/trains/${id}`, data),
  delete: (id) => adminAPI.delete(`/trains/${id}`),
  toggleStatus: (id) => adminAPI.patch(`/trains/${id}/toggle`)
}

export const adminDashboardService = {
  getStats: () => adminAPI.get('/dashboard/stats'),
  getRevenue: () => adminAPI.get('/dashboard/revenue'),
  getRecentBookings: () => adminAPI.get('/dashboard/recent-bookings'),
  getAvailability: () => adminAPI.get('/dashboard/availability')
}

export const adminService = {
  getPendingHotels: () => adminAPI.get('/approvals/hotels'),
  approveHotel: (id) => adminAPI.patch(`/approvals/hotels/${id}/approve`),
  rejectHotel: (id, data) => adminAPI.patch(`/approvals/hotels/${id}/reject`, data),
  getPendingFlights: () => adminAPI.get('/approvals/flights'),
  approveFlight: (id) => adminAPI.patch(`/approvals/flights/${id}/approve`),
  rejectFlight: (id, data) => adminAPI.patch(`/approvals/flights/${id}/reject`, data),
  getPendingBuses: () => adminAPI.get('/approvals/buses'),
  approveBus: (id) => adminAPI.patch(`/approvals/buses/${id}/approve`),
  rejectBus: (id, data) => adminAPI.patch(`/approvals/buses/${id}/reject`, data),
  getPendingCabs: () => adminAPI.get('/approvals/cabs'),
  approveCab: (id) => adminAPI.patch(`/approvals/cabs/${id}/approve`),
  rejectCab: (id, data) => adminAPI.patch(`/approvals/cabs/${id}/reject`, data),
  getPendingTrains: () => adminAPI.get('/approvals/trains'),
  approveTrain: (id) => adminAPI.patch(`/approvals/trains/${id}/approve`),
  rejectTrain: (id, data) => adminAPI.patch(`/approvals/trains/${id}/reject`, data)
}

export const adminBookingsService = {
  getAll: (params) => adminAPI.get('/bookings', { params })
}

export default adminAPI

