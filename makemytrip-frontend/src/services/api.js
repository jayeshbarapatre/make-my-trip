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
  (err) => Promise.reject(err.response?.data?.message || err.message),
)

export default api
