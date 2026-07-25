// Mock Data Middleware
// Intercepts database calls and returns realistic mock data when USE_MOCK_DATA=true

import mockData from '../services/mockData.js'
import bcrypt from 'bcryptjs'

// In-memory mock storage for bookings created during this session
let mockBookings = []
let mockUsers = []
let otpStore = {} // Store OTPs temporarily

// Pre-populate with test users for easy testing
const initializeTestUsers = async () => {
  // Only add if empty (first initialization)
  if (mockUsers.length === 0) {
    const hashedPassword1 = await bcrypt.hash('test@1234', 10)
    const hashedPassword2 = await bcrypt.hash('demo@1234', 10)

    mockUsers.push(
      {
        id: 'test-user-1',
        name: 'Test User',
        email: 'test@makemytrip.com',
        phone: '9876543210',
        password: hashedPassword1,
        is_admin: false,
        createdAt: new Date()
      },
      {
        id: 'test-user-2',
        name: 'Demo User',
        email: 'demo@makemytrip.com',
        phone: '9123456789',
        password: hashedPassword2,
        is_admin: false,
        createdAt: new Date()
      }
    )
    console.log('✅ Test users initialized for mock database')
  }
}

// Initialize test users on module load
initializeTestUsers()

// Helper: Filter mock data based on search criteria
const filterMockData = (data, filters) => {
  if (!filters || Object.keys(filters).length === 0) return data

  return data.filter(item => {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue

      // Handle nested object searches (e.g., departure.city)
      if (key.includes('.')) {
        const keys = key.split('.')
        let itemValue = item
        for (const k of keys) {
          itemValue = itemValue?.[k]
        }
        if (itemValue?.toString().toLowerCase() !== value.toString().toLowerCase()) {
          return false
        }
      } else if (item[key]?.toString().toLowerCase() !== value.toString().toLowerCase()) {
        return false
      }
    }
    return true
  })
}

// Mock Prisma Client
export const createMockPrismaClient = () => {
  return {
    flight: {
      findUnique: async ({ where }) => {
        const flight = mockData.flights.find(f => f.id === where.id)
        return flight || null
      },
      findMany: async ({ where, orderBy, skip, take }) => {
        let results = [...mockData.flights]

        // Apply filters
        if (where) {
          if (where.id) results = results.filter(f => f.id === where.id)
          if (where.isActive !== undefined) results = results.filter(f => f.isActive === where.isActive)
        }

        // Apply ordering
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0]
          results.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            return direction === 'asc' ? aVal - bVal : bVal - aVal
          })
        }

        // Apply pagination
        if (skip !== undefined && take !== undefined) {
          return results.slice(skip, skip + take)
        }
        return results
      },
      create: async ({ data }) => {
        const newFlight = {
          id: `FL-${Date.now()}`,
          ...data,
          seatsAvailable: data.seatsAvailable || data.seats || 180,
          isActive: true
        }
        mockData.flights.push(newFlight)
        return newFlight
      },
      update: async ({ where, data }) => {
        const index = mockData.flights.findIndex(f => f.id === where.id)
        if (index === -1) throw new Error('Flight not found')
        mockData.flights[index] = { ...mockData.flights[index], ...data }
        return mockData.flights[index]
      },
      delete: async ({ where }) => {
        const index = mockData.flights.findIndex(f => f.id === where.id)
        if (index === -1) throw new Error('Flight not found')
        mockData.flights.splice(index, 1)
        return { id: where.id }
      },
      count: async ({ where }) => {
        return mockData.flights.filter(f => !where || f.isActive === where.isActive).length
      }
    },

    hotel: {
      findUnique: async ({ where }) => {
        const hotel = mockData.hotels.find(h => h.id === where.id)
        return hotel || null
      },
      findMany: async ({ where, orderBy, skip, take }) => {
        let results = [...mockData.hotels]

        // Apply filters
        if (where) {
          if (where.isActive !== undefined) {
            results = results.filter(h => h.isActive === where.isActive)
          }
          if (where.OR) {
            results = results.filter(h => {
              return where.OR.some(condition => {
                if (condition.city?.contains) {
                  return h.city.toLowerCase().includes(condition.city.contains.toLowerCase())
                }
                if (condition.name?.contains) {
                  return h.name.toLowerCase().includes(condition.name.contains.toLowerCase())
                }
                if (condition.location?.contains) {
                  return h.location.toLowerCase().includes(condition.location.contains.toLowerCase())
                }
                return false
              })
            })
          }
        }

        // Apply ordering
        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0]
          results.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            return direction === 'asc' ? aVal - bVal : bVal - aVal
          })
        }

        // Apply pagination
        if (skip !== undefined && take !== undefined) {
          return results.slice(skip, skip + take)
        }
        return results
      },
      create: async ({ data }) => {
        const newHotel = {
          id: `HT-${Date.now()}`,
          ...data,
          roomsAvailable: data.roomsAvailable || 20,
          isActive: true
        }
        mockData.hotels.push(newHotel)
        return newHotel
      },
      update: async ({ where, data }) => {
        const index = mockData.hotels.findIndex(h => h.id === where.id)
        if (index === -1) throw new Error('Hotel not found')
        mockData.hotels[index] = { ...mockData.hotels[index], ...data }
        return mockData.hotels[index]
      },
      delete: async ({ where }) => {
        const index = mockData.hotels.findIndex(h => h.id === where.id)
        if (index === -1) throw new Error('Hotel not found')
        mockData.hotels.splice(index, 1)
        return { id: where.id }
      },
      count: async ({ where }) => {
        return mockData.hotels.filter(h => !where || h.isActive === where.isActive).length
      }
    },

    bus: {
      findUnique: async ({ where }) => {
        const bus = mockData.buses.find(b => b.id === where.id)
        return bus || null
      },
      findMany: async ({ where, orderBy }) => {
        let results = [...mockData.buses]

        if (where) {
          if (where.isActive !== undefined) {
            results = results.filter(b => b.isActive === where.isActive)
          }
          if (where.listingStatus !== undefined) {
            results = results.filter(b => b.listingStatus === where.listingStatus)
          }
          if (where.type !== undefined) {
            results = results.filter(b => b.type === where.type)
          }
        }

        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0]
          results.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            return direction === 'asc' ? aVal - bVal : bVal - aVal
          })
        }

        return results
      },
      update: async ({ where, data }) => {
        const index = mockData.buses.findIndex(b => b.id === where.id)
        if (index === -1) throw new Error('Bus not found')
        mockData.buses[index] = { ...mockData.buses[index], ...data }
        return mockData.buses[index]
      },
      count: async () => mockData.buses.length
    },

    train: {
      findUnique: async ({ where }) => {
        const train = mockData.trains.find(t => t.id === where.id)
        return train || null
      },
      findMany: async ({ where, orderBy }) => {
        let results = [...mockData.trains]

        if (where && where.isActive !== undefined) {
          results = results.filter(t => t.isActive === where.isActive)
        }

        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0]
          results.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            return direction === 'asc' ? aVal - bVal : bVal - aVal
          })
        }

        return results
      },
      count: async () => mockData.trains.length
    },

    cab: {
      findUnique: async ({ where }) => {
        const cab = mockData.cabs.find(c => c.id === where.id)
        return cab || null
      },
      findMany: async ({ where, orderBy }) => {
        let results = [...mockData.cabs]

        if (where && where.isActive !== undefined) {
          results = results.filter(c => c.isActive === where.isActive)
        }

        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0]
          results.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            return direction === 'asc' ? aVal - bVal : bVal - aVal
          })
        }

        return results
      },
      count: async () => mockData.cabs.length
    },

    booking: {
      findUnique: async ({ where }) => {
        return mockBookings.find(b => b.id === where.id) || null
      },
      findMany: async ({ where, skip, take, orderBy }) => {
        let results = [...mockBookings]

        if (where) {
          if (where.userId) results = results.filter(b => b.userId === where.userId)
          if (where.id) results = results.filter(b => b.id === where.id)
        }

        if (orderBy) {
          const [field, direction] = Object.entries(orderBy)[0]
          results.sort((a, b) => {
            const aVal = a[field]
            const bVal = b[field]
            if (typeof aVal === 'string') {
              return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
            }
            return direction === 'asc' ? aVal - bVal : bVal - aVal
          })
        }

        if (skip !== undefined && take !== undefined) {
          return results.slice(skip, skip + take)
        }
        return results
      },
      create: async ({ data }) => {
        const newBooking = {
          id: `BK-${Date.now()}`,
          createdAt: new Date(),
          ...data
        }
        mockBookings.push(newBooking)
        return newBooking
      },
      count: async ({ where }) => {
        if (!where) return mockBookings.length
        let count = mockBookings
        if (where.userId) count = count.filter(b => b.userId === where.userId)
        return count.length
      }
    },

    user: {
      findUnique: async ({ where }) => {
        if (where.email) {
          return mockUsers.find(u => u.email === where.email) || null
        }
        if (where.id) {
          return mockUsers.find(u => u.id === where.id) || null
        }
        return null
      },
      findMany: async () => [...mockUsers],
      create: async ({ data }) => {
        const newUser = {
          id: `U-${Date.now()}`,
          createdAt: new Date(),
          ...data
        }
        mockUsers.push(newUser)
        return newUser
      },
      update: async ({ where, data }) => {
        const index = mockUsers.findIndex(u => u.id === where.id || u.email === where.email)
        if (index === -1) throw new Error('User not found')
        mockUsers[index] = { ...mockUsers[index], ...data }
        return mockUsers[index]
      },
      count: async () => mockUsers.length
    }
  }
}

// Express middleware to provide mock Prisma client to routes
export const mockDataMiddleware = (req, res, next) => {
  if (process.env.USE_MOCK_DATA === 'true') {
    req.mockPrisma = createMockPrismaClient()
    req.otpStore = otpStore
    req.mockBookings = mockBookings
    req.mockUsers = mockUsers
  }
  next()
}

// Helper function to send OTP (mock)
export const sendMockOTP = (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  otpStore[email] = { otp, timestamp: Date.now() }
  console.log(`[MOCK] OTP for ${email}: ${otp}`)
  return otp
}

// Helper function to verify OTP (mock)
export const verifyMockOTP = (email, otp) => {
  const stored = otpStore[email]
  if (!stored) return false
  // OTP valid for 10 minutes
  if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
    delete otpStore[email]
    return false
  }
  return stored.otp === otp
}

export { mockData }
