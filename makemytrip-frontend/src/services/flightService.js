import api from './api'

export const flightService = {
  // Public flight endpoints
  getAll: () => {
    console.log('ðŸ“‹ Fetching all flights...')
    return api.get('/flights').then(res => {
      console.log('âœ“ All flights:', res.data)
      return res
    }).catch(err => {
      console.error('âœ— Failed to fetch flights:', err)
      throw err
    })
  },

  search: (params) => {
    console.log('ðŸ” Searching flights with params:', params)
    return api.get('/flights/search', { params }).then(res => {
      console.log('âœ“ Search results:', res.data)
      return res
    }).catch(err => {
      console.error('âœ— Search error:', err)
      throw err
    })
  },

  getById: (id) => api.get(`/flights/${id}`),
  create: (data) => api.post('/flights', data),
  update: (id, data) => api.put(`/flights/${id}`, data),
  delete: (id) => api.delete(`/flights/${id}`),

  // Autocomplete endpoints - extract data array
  getAirlines: (query) => api.get('/autocomplete/airlines', { params: { q: query } })
    .then(res => res.data.data || [])
    .catch(err => {
      console.error('âŒ Airlines fetch failed:', err)
      return []
    }),

  getAirports: (query) => api.get('/autocomplete/airports', { params: { q: query } })
    .then(res => res.data.data || [])
    .catch(err => {
      console.error('âŒ Airports fetch failed:', err)
      return []
    }),

  getCities: (query) => api.get('/autocomplete/cities', { params: { q: query } })
    .then(res => res.data.data || [])
    .catch(err => {
      console.error('âŒ Cities fetch failed:', err)
      return []
    }),

  getAircrafts: (query) => api.get('/autocomplete/aircrafts', { params: { q: query } })
    .then(res => res.data.data || [])
    .catch(err => {
      console.error('âŒ Aircrafts fetch failed:', err)
      return []
    }),

  getFlightNumbers: (query) => api.get('/autocomplete/flightNumbers', { params: { q: query } })
    .then(res => res.data.data || [])
    .catch(err => {
      console.error('âŒ Flight numbers fetch failed:', err)
      return []
    })
}

