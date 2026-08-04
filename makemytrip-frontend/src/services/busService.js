import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

const api = axios.create({
  baseURL: `${API_BASE_URL}/buses`
})

export const busService = {
  search: (params) => api.get('/search', { params }),
  getById: (id) => api.get(`/${id}`)
}

export default busService
