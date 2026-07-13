import { describe, it, expect } from 'vitest'
import {
  isValidDate,
  parseDate,
  calculateNights,
  isCheckoutAfterCheckin,
  isDateInPast,
  getMinimumCheckoutDate
} from '../../src/utils/dateUtils.js'

describe('Date Utilities', () => {
  describe('isValidDate', () => {
    it('should validate correct date format', () => {
      expect(isValidDate('2024-06-15')).toBe(true)
      expect(isValidDate('2025-12-31')).toBe(true)
    })

    it('should reject invalid formats', () => {
      expect(isValidDate('06/15/2024')).toBe(false)
      expect(isValidDate('2024-6-15')).toBe(false)
      expect(isValidDate('15-06-2024')).toBe(false)
      expect(isValidDate('invalid')).toBe(false)
    })

    it('should reject null/undefined', () => {
      expect(isValidDate(null)).toBe(false)
      expect(isValidDate(undefined)).toBe(false)
      expect(isValidDate('')).toBe(false)
    })

    it('should reject invalid month/day format', () => {
      expect(isValidDate('2024-13-01')).toBe(false)
      expect(isValidDate('2024-00-15')).toBe(false)
    })
  })

  describe('calculateNights', () => {
    it('should calculate nights correctly', () => {
      expect(calculateNights('2024-06-15', '2024-06-20')).toBe(5)
      expect(calculateNights('2024-06-15', '2024-06-16')).toBe(1)
    })

    it('should return null for invalid dates', () => {
      expect(calculateNights('invalid', '2024-06-20')).toBeNull()
      expect(calculateNights('2024-06-15', 'invalid')).toBeNull()
    })

    it('should return null when checkout before checkin', () => {
      expect(calculateNights('2024-06-20', '2024-06-15')).toBeNull()
      expect(calculateNights('2024-06-15', '2024-06-15')).toBeNull()
    })

    it('should handle same day checkout', () => {
      const nights = calculateNights('2024-06-15', '2024-06-16')
      expect(nights).toBe(1)
    })
  })

  describe('isCheckoutAfterCheckin', () => {
    it('should validate checkout after checkin', () => {
      expect(isCheckoutAfterCheckin('2024-06-15', '2024-06-20')).toBe(true)
    })

    it('should reject checkout before or equal to checkin', () => {
      expect(isCheckoutAfterCheckin('2024-06-20', '2024-06-15')).toBe(false)
      expect(isCheckoutAfterCheckin('2024-06-15', '2024-06-15')).toBe(false)
    })

    it('should handle invalid dates', () => {
      const result = isCheckoutAfterCheckin('invalid', '2024-06-20')
      expect(typeof result).toBe('boolean')
    })
  })

  describe('isDateInPast', () => {
    it('should identify past dates', () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      const pastDateStr = pastDate.toISOString().split('T')[0]
      expect(isDateInPast(pastDateStr)).toBe(true)
    })

    it('should identify future dates', () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 1)
      const futureDateStr = futureDate.toISOString().split('T')[0]
      expect(isDateInPast(futureDateStr)).toBe(false)
    })

    it('should identify today as not in past', () => {
      const today = new Date().toISOString().split('T')[0]
      expect(isDateInPast(today)).toBe(false)
    })
  })

  describe('getMinimumCheckoutDate', () => {
    it('should return a valid date string format', () => {
      const checkIn = '2024-06-15'
      const checkout = getMinimumCheckoutDate(checkIn)
      expect(typeof checkout).toBe('string')
      expect(checkout).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
})
