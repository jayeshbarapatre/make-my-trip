import api from './api'

export const cabService = {
  // Public cab endpoints
  search: (params) => {
    console.log('🔍 Searching cabs with params:', params)
    return api.get('/cabs/search', { params }).then(res => {
      console.log('✓ Search results:', res.data)
      return res
    }).catch(err => {
      console.error('✗ Search error:', err)
      throw err
    })
  },

  getById: (id) => {
    console.log('🔍 Fetching cab details for ID:', id)
    return api.get(`/cabs/${id}`).then(res => {
      console.log('✓ Cab details:', res.data)
      return res
    }).catch(err => {
      console.error('✗ Cab fetch error:', err)
      throw err
    })
  },

  createBooking: (bookingData) => {
    console.log('📝 Creating cab booking:', bookingData)
    return api.post('/bookings', bookingData).then(res => {
      console.log('✓ Booking created:', res.data)
      return res
    }).catch(err => {
      console.error('✗ Booking error:', err)
      throw err
    })
  }
}
