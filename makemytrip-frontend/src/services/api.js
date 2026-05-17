import axios from 'axios'
import { API_BASE_URL, API_TIMEOUT } from '../config/api.config'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'An error occurred'
    const error = new Error(message)
    error.status = err.response?.status || 500
    error.data = err.response?.data
    return Promise.reject(error)
  }
)

export default api
