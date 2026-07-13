import { describe, it, expect } from 'vitest'
import {
  validateEmail,
  validatePhone,
  validatePassword,
  validateName,
  validatePrice,
  validateSeats
} from '../../src/utils/validation.js'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user@domain.co.uk')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
      expect(validateEmail('user @example.com')).toBe(false)
    })

    it('should reject null/undefined', () => {
      expect(validateEmail(null)).toBe(false)
      expect(validateEmail(undefined)).toBe(false)
      expect(validateEmail('')).toBe(false)
    })

    it('should reject email exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@example.com'
      expect(validateEmail(longEmail)).toBe(false)
    })
  })

  describe('validatePhone', () => {
    it('should validate correct phone numbers', () => {
      expect(validatePhone('9876543210')).toBe(true)
      expect(validatePhone('+91-9876543210')).toBe(true)
      expect(validatePhone('(987) 654-3210')).toBe(true)
    })

    it('should reject invalid lengths', () => {
      expect(validatePhone('123')).toBe(false)
      expect(validatePhone('12345678901234567')).toBe(false)
    })

    it('should accept phone with letters mixed in', () => {
      // validatePhone extracts only digits, so 'abc9876543210' has 10 digits
      expect(validatePhone('abc9876543210')).toBe(true)
    })

    it('should reject phone with too few digits', () => {
      // 'abcd1234567' has only 7 digits, needs at least 10
      expect(validatePhone('abcd1234567')).toBe(false)
    })
  })

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('MyPassword123')).toBe(true)
      expect(validatePassword('Test@2024Pass')).toBe(true)
    })

    it('should reject short passwords', () => {
      expect(validatePassword('Pass1')).toBe(false)
    })

    it('should require digits', () => {
      expect(validatePassword('NoDigitPassword')).toBe(false)
    })

    it('should reject null/empty', () => {
      expect(validatePassword(null)).toBe(false)
      expect(validatePassword('')).toBe(false)
    })
  })

  describe('validateName', () => {
    it('should validate correct names', () => {
      expect(validateName('John Doe')).toBe(true)
      expect(validateName('Jo')).toBe(true)
    })

    it('should reject short names', () => {
      expect(validateName('J')).toBe(false)
    })

    it('should reject long names', () => {
      const longName = 'A'.repeat(150)
      expect(validateName(longName)).toBe(false)
    })

    it('should reject null/empty', () => {
      expect(validateName(null)).toBe(false)
      expect(validateName('')).toBe(false)
    })
  })

  describe('validatePrice', () => {
    it('should validate correct prices', () => {
      const result = validatePrice(5000)
      expect(result.valid).toBe(true)
      expect(result.price).toBe(5000)
    })

    it('should reject zero and negative prices', () => {
      expect(validatePrice(0).valid).toBe(false)
      expect(validatePrice(-100).valid).toBe(false)
    })

    it('should reject prices exceeding max', () => {
      expect(validatePrice(1000001).valid).toBe(false)
    })

    it('should accept price at max limit', () => {
      expect(validatePrice(1000000).valid).toBe(true)
    })

    it('should reject non-numeric', () => {
      expect(validatePrice('invalid').valid).toBe(false)
    })
  })

  describe('validateSeats', () => {
    it('should validate correct seat counts', () => {
      const result = validateSeats(100)
      expect(result.valid).toBe(true)
      expect(result.seats).toBe(100)
    })

    it('should allow zero seats', () => {
      expect(validateSeats(0).valid).toBe(true)
    })

    it('should reject negative seats', () => {
      expect(validateSeats(-1).valid).toBe(false)
    })

    it('should reject seats exceeding max', () => {
      expect(validateSeats(600).valid).toBe(false)
    })
  })
})
