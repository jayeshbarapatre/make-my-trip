import { describe, it, expect } from 'vitest'
import { sendSuccess, sendPaginatedSuccess, sendError } from '../../src/utils/apiResponse.js'

describe('API Response Format', () => {
  describe('sendSuccess', () => {
    it('should return success response with correct structure', () => {
      const mockRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      sendSuccess(mockRes, 'Operation successful', { id: 1, name: 'Test' }, 200)

      expect(mockRes.statusCode).toBe(200)
      expect(mockRes.jsonData).toEqual({
        success: true,
        message: 'Operation successful',
        data: { id: 1, name: 'Test' }
      })
    })

    it('should use default status code 200', () => {
      const mockRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      sendSuccess(mockRes, 'Success')

      expect(mockRes.statusCode).toBe(200)
    })

    it('should include data in response', () => {
      const mockRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      const testData = { userId: 1, email: 'test@example.com' }
      sendSuccess(mockRes, 'User found', testData)

      expect(mockRes.jsonData.data).toEqual(testData)
    })
  })

  describe('sendPaginatedSuccess', () => {
    it('should return paginated response with metadata', () => {
      const mockRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      const data = [{ id: 1 }, { id: 2 }]
      const pagination = { page: 1, limit: 10, total: 50 }

      sendPaginatedSuccess(mockRes, 'Results found', data, pagination, 200)

      expect(mockRes.statusCode).toBe(200)
      expect(mockRes.jsonData.success).toBe(true)
      expect(mockRes.jsonData.data).toEqual(data)
      expect(mockRes.jsonData.pagination).toEqual(pagination)
    })

    it('should include pagination metadata', () => {
      const mockRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      const pagination = {
        page: 2,
        limit: 20,
        total: 100,
        pages: 5
      }

      sendPaginatedSuccess(mockRes, 'Results', [], pagination)

      expect(mockRes.jsonData.pagination).toEqual(pagination)
    })
  })

  describe('sendError', () => {
    it('should return error response with correct structure', () => {
      const mockRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      sendError(mockRes, 'Operation failed', 400)

      expect(mockRes.statusCode).toBe(400)
      expect(mockRes.jsonData).toEqual({
        success: false,
        message: 'Operation failed'
      })
    })

    it('should handle different error codes', () => {
      const testCases = [
        { code: 400, message: 'Bad Request' },
        { code: 401, message: 'Unauthorized' },
        { code: 403, message: 'Forbidden' },
        { code: 404, message: 'Not Found' },
        { code: 500, message: 'Server Error' }
      ]

      for (const testCase of testCases) {
        const mockRes = {
          status: function(code) { this.statusCode = code; return this },
          json: function(data) { this.jsonData = data; return this }
        }

        sendError(mockRes, testCase.message, testCase.code)

        expect(mockRes.statusCode).toBe(testCase.code)
        expect(mockRes.jsonData.success).toBe(false)
      }
    })

    it('should NOT include sensitive data in error response', () => {
      const mockRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      sendError(mockRes, 'Database connection error: user=admin password=secret', 500)

      // Should not leak credentials
      expect(mockRes.jsonData.message).not.toContain('password')
      expect(mockRes.jsonData.message).not.toContain('user=admin')
    })
  })

  describe('Response consistency', () => {
    it('should always include success field', () => {
      const successRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      const errorRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      sendSuccess(successRes, 'OK', {})
      sendError(errorRes, 'Error', 400)

      expect(successRes.jsonData).toHaveProperty('success')
      expect(errorRes.jsonData).toHaveProperty('success')
    })

    it('should always include message field', () => {
      const successRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      const errorRes = {
        status: function(code) { this.statusCode = code; return this },
        json: function(data) { this.jsonData = data; return this }
      }

      sendSuccess(successRes, 'Operation completed')
      sendError(errorRes, 'Operation failed')

      expect(successRes.jsonData).toHaveProperty('message')
      expect(errorRes.jsonData).toHaveProperty('message')
    })
  })
})
