import { describe, it, expect } from 'vitest'
import {
  generateBookingId,
  generatePNR,
  calculatePassengerCount,
  calculateRoomCount,
  validateBookingData
} from '../../src/utils/bookingUtils.js'

describe('Booking Utilities', () => {
  describe('generateBookingId', () => {
    it('should generate valid flight booking ID', () => {
      const id = generateBookingId('flight')
      expect(id).toMatch(/^FLT-/)
      expect(id.length).toBeGreaterThan(10)
    })

    it('should generate valid hotel booking ID', () => {
      const id = generateBookingId('hotel')
      expect(id).toMatch(/^HTL-/)
      expect(id.length).toBeGreaterThan(10)
    })

    it('should generate unique IDs', () => {
      const id1 = generateBookingId()
      const id2 = generateBookingId()
      expect(id1).not.toBe(id2)
    })
  })

  describe('generatePNR', () => {
    it('should generate valid flight PNR', () => {
      const pnr = generatePNR('flight')
      expect(pnr).toMatch(/^PNR-/)
      expect(pnr.length).toBeGreaterThan(8)
    })

    it('should generate valid hotel PNR', () => {
      const pnr = generatePNR('hotel')
      expect(pnr).toMatch(/^HTL-/)
    })

    it('should generate unique PNRs', () => {
      const pnr1 = generatePNR()
      const pnr2 = generatePNR()
      expect(pnr1).not.toBe(pnr2)
    })
  })

  describe('calculatePassengerCount', () => {
    it('should count array of passengers', () => {
      const travellers = [{ name: 'John' }, { name: 'Jane' }]
      expect(calculatePassengerCount(travellers)).toBe(2)
    })

    it('should calculate from passenger object', () => {
      const travellers = { adults: 2, children: 1, infants: 0 }
      expect(calculatePassengerCount(travellers)).toBe(3)
    })

    it('should default to 1 passenger', () => {
      expect(calculatePassengerCount(null)).toBe(1)
      expect(calculatePassengerCount(undefined)).toBe(1)
      expect(calculatePassengerCount({})).toBe(1)
    })

    it('should handle partial passenger object', () => {
      const travellers = { adults: 2 }
      expect(calculatePassengerCount(travellers)).toBe(2)
    })
  })

  describe('calculateRoomCount', () => {
    it('should extract rooms from travellers object', () => {
      const travellers = { rooms: 3 }
      expect(calculateRoomCount(travellers)).toBe(3)
    })

    it('should default to 1 room', () => {
      expect(calculateRoomCount(null)).toBe(1)
      expect(calculateRoomCount({})).toBe(1)
    })
  })

  describe('validateBookingData', () => {
    it('should validate correct flight booking', () => {
      const data = {
        type: 'flight',
        flightId: 'flight-123',
        totalAmount: 5000
      }
      const result = validateBookingData(data)
      expect(result.isValid).toBe(true)
      expect(result.errors).toEqual({})
    })

    it('should validate correct hotel booking', () => {
      const data = {
        type: 'hotel',
        hotelId: 'hotel-123',
        totalAmount: 10000
      }
      const result = validateBookingData(data)
      expect(result.isValid).toBe(true)
    })

    it('should reject missing type', () => {
      const data = { totalAmount: 5000 }
      const result = validateBookingData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.type).toBeDefined()
    })

    it('should reject invalid amount', () => {
      const data = {
        type: 'flight',
        flightId: 'flight-123',
        totalAmount: -100
      }
      const result = validateBookingData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.totalAmount).toBeDefined()
    })

    it('should reject flight booking without flightId', () => {
      const data = {
        type: 'flight',
        totalAmount: 5000
      }
      const result = validateBookingData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.flightId).toBeDefined()
    })

    it('should reject hotel booking without hotelId', () => {
      const data = {
        type: 'hotel',
        totalAmount: 5000
      }
      const result = validateBookingData(data)
      expect(result.isValid).toBe(false)
      expect(result.errors.hotelId).toBeDefined()
    })
  })
})
