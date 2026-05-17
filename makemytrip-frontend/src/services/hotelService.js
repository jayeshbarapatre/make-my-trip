import api from './api'

export const searchHotels = async (params) => {
  return await api.get('/hotels/search', { params })
}

export const getHotelDetails = async (id) => {
  return await api.get(`/hotels/${id}`)
}

export const getHotelImages = async (hotelId) => {
  return await api.get(`/admin/hotels/${hotelId}/images`)
}

export const updateHotelImages = async (hotelId, imageUrls) => {
  return await api.put(`/admin/hotels/${hotelId}/images`, { imageUrls })
}
