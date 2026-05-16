import api from './api'

export const flightService = {
  getAll: () => api.get('/flights'),
  search: (params) => api.get('/flights', { params }),
  getById: (id) => api.get(`/flights/${id}`),
  create: (data) => api.post('/flights', data),
  update: (id, data) => api.put(`/flights/${id}`, data),
  delete: (id) => api.delete(`/flights/${id}`),
  getAirlines: (query) => api.get('/autocomplete/airlines', { params: { q: query } }),
  getAirports: (query) => api.get('/autocomplete/airports', { params: { q: query } }),
  getCities: (query) => api.get('/autocomplete/cities', { params: { q: query } }),
  getAircrafts: (query) => api.get('/autocomplete/aircrafts', { params: { q: query } })
}
