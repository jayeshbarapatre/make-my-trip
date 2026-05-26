import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const vendorAPI = axios.create({
  baseURL: `${API_BASE_URL}/vendor`,
  headers: { 'Content-Type': 'application/json' }
})

vendorAPI.interceptors.request.use(config => {
  const token = localStorage.getItem('vendorToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const vendorAuthService = {
  register: (data) => vendorAPI.post('/register', data),
  login: (email, password) => vendorAPI.post('/login', { email, password }),
  getProfile: () => vendorAPI.get('/profile'),
  logout: () => vendorAPI.post('/logout'),
  changePassword: (currentPassword, newPassword) => vendorAPI.put('/change-password', { currentPassword, newPassword })
}

export const vendorHotelsService = {
  getAll: (params) => vendorAPI.get('/hotels', { params }),
  getById: (id) => vendorAPI.get(`/hotels/${id}`),
  create: (data) => vendorAPI.post('/hotels', data),
  update: (id, data) => vendorAPI.put(`/hotels/${id}`, data),
  delete: (id) => vendorAPI.delete(`/hotels/${id}`),
  submit: (id) => vendorAPI.patch(`/hotels/${id}/submit`),
  toggleStatus: (id) => vendorAPI.patch(`/hotels/${id}/toggle`)
}

export const vendorRoomsService = {
  getByHotel: (hotelId, params) => vendorAPI.get(`/hotels/${hotelId}/rooms`, { params }),
  create: (hotelId, data) => vendorAPI.post(`/hotels/${hotelId}/rooms`, data),
  update: (hotelId, roomId, data) => vendorAPI.put(`/hotels/${hotelId}/rooms/${roomId}`, data),
  delete: (hotelId, roomId) => vendorAPI.delete(`/hotels/${hotelId}/rooms/${roomId}`),
  toggleStatus: (hotelId, roomId) => vendorAPI.patch(`/hotels/${hotelId}/rooms/${roomId}/toggle`)
}

export const vendorFlightsService = {
  getAll: (params) => vendorAPI.get('/flights', { params }),
  getById: (id) => vendorAPI.get(`/flights/${id}`),
  create: (data) => vendorAPI.post('/flights', data),
  update: (id, data) => vendorAPI.put(`/flights/${id}`, data),
  delete: (id) => vendorAPI.delete(`/flights/${id}`),
  submit: (id) => vendorAPI.patch(`/flights/${id}/submit`),
  toggleStatus: (id) => vendorAPI.patch(`/flights/${id}/toggle`)
}

export const vendorBusesService = {
  getAll: (params) => vendorAPI.get('/buses', { params }),
  create: (data) => vendorAPI.post('/buses', data),
  update: (id, data) => vendorAPI.put(`/buses/${id}`, data),
  delete: (id) => vendorAPI.delete(`/buses/${id}`),
  submit: (id) => vendorAPI.patch(`/buses/${id}/submit`)
}

export const vendorCabsService = {
  getAll: (params) => vendorAPI.get('/cabs', { params }),
  create: (data) => vendorAPI.post('/cabs', data),
  update: (id, data) => vendorAPI.put(`/cabs/${id}`, data),
  delete: (id) => vendorAPI.delete(`/cabs/${id}`),
  submit: (id) => vendorAPI.patch(`/cabs/${id}/submit`)
}

export const vendorTrainsService = {
  getAll: (params) => vendorAPI.get('/trains', { params }),
  create: (data) => vendorAPI.post('/trains', data),
  update: (id, data) => vendorAPI.put(`/trains/${id}`, data),
  delete: (id) => vendorAPI.delete(`/trains/${id}`),
  submit: (id) => vendorAPI.patch(`/trains/${id}/submit`)
}

export default vendorAPI
