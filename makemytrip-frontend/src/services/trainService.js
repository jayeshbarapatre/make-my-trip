import api from './api'

export const trainService = {
  getAll: () => api.get('/trains'),
  getById: (id) => api.get(`/trains/${id}`),
  search: (params) => api.get('/trains/search', { params }),
  create: (data) => api.post('/trains', data),
  update: (id, data) => api.put(`/trains/${id}`, data),
  delete: (id) => api.delete(`/trains/${id}`)
}
