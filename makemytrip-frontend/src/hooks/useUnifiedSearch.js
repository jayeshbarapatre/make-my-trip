import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

// Search Flights from multiple providers
export function useFlightSearch(from, to, date, passengers = 1, enabled = true) {
  return useQuery({
    queryKey: ['flights', from, to, date, passengers],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/search/flights`, {
        params: { from, to, date, passengers }
      })
      return response.data.data || []
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    enabled: enabled && !!from && !!to && !!date,
    refetchOnWindowFocus: false
  })
}

// Search Hotels from multiple providers
export function useHotelSearch(destination, checkinDate, checkoutDate, guests = 1, enabled = true) {
  return useQuery({
    queryKey: ['hotels', destination, checkinDate, checkoutDate, guests],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/search/hotels`, {
        params: { destination, checkinDate, checkoutDate, guests }
      })
      return response.data.data || []
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    enabled: enabled && !!destination && !!checkinDate && !!checkoutDate,
    refetchOnWindowFocus: false
  })
}

// Search Buses from multiple providers
export function useBusSearch(from, to, date, enabled = true) {
  return useQuery({
    queryKey: ['buses', from, to, date],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/search/buses`, {
        params: { from, to, date }
      })
      return response.data.data || []
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    enabled: enabled && !!from && !!to && !!date,
    refetchOnWindowFocus: false
  })
}

// Search Cabs from multiple providers
export function useCabSearch(fromLat, fromLng, toLat, toLng, enabled = true) {
  return useQuery({
    queryKey: ['cabs', fromLat, fromLng, toLat, toLng],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/search/cabs`, {
        params: { fromLat, fromLng, toLat, toLng }
      })
      return response.data.data || []
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    retry: 2,
    enabled: enabled && fromLat && fromLng && toLat && toLng,
    refetchOnWindowFocus: false
  })
}

// Get all available providers' status
export function useProvidersStatus() {
  return useQuery({
    queryKey: ['providers-status'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE}/search/providers`)
      return response.data
    },
    staleTime: Infinity,
    cacheTime: Infinity
  })
}

