import bcrypt from 'bcryptjs'

import fs from 'fs'
import path from 'path'

const DB_FILE = path.resolve('db.json')

let defaultData = {
  users: [
    {
      id: "usr_1111-2222-3333-4444",
      name: "Jayesh Sharma",
      email: "jayesh@gmail.com",
      phone: "9988776655",
      password: bcrypt.hashSync("Psspl@123#", 10), 
      createdAt: new Date()
    }
  ],
  bookings: [
    {
      id: "bkg_abcd-1234-5678-90ef",
      userId: "usr_1111-2222-3333-4444",
      type: "flight",
      fromCity: "Delhi (DEL)",
      toCity: "Bengaluru (BLR)",
      departureDate: "2026-05-20",
      returnDate: "2026-05-25",
      travellers: { adults: 1, children: 0, infants: 0 },
      totalAmount: 6499,
      status: "confirmed",
      bookingId: "MMT-FL-987654",
      pnr: "PNR-884422",
      createdAt: new Date(Date.now() - 2 * 86400000)
    },
    {
      id: "bkg_ef01-2345-6789-abcd",
      userId: "usr_1111-2222-3333-4444",
      type: "hotel",
      fromCity: "Goa Beach Resort",
      toCity: "Goa",
      departureDate: "2026-06-10",
      returnDate: "2026-06-14",
      travellers: { rooms: 1, adults: 2, children: 0 },
      totalAmount: 14500,
      status: "confirmed",
      bookingId: "MMT-HT-123456",
      pnr: "HTL-557799",
      createdAt: new Date(Date.now() - 5 * 86400000)
    },
    {
      id: "bkg_9999-8888-7777-6666",
      userId: "usr_1111-2222-3333-4444",
      type: "flight",
      fromCity: "Mumbai (BOM)",
      toCity: "Jaipur (JAI)",
      departureDate: "2026-04-10",
      returnDate: "2026-04-15",
      travellers: { adults: 2, children: 1, infants: 0 },
      totalAmount: 12400,
      status: "completed",
      bookingId: "MMT-FL-554433",
      pnr: "PNR-112233",
      createdAt: new Date(Date.now() - 40 * 86400000)
    },
    {
      id: "bkg_7777-6666-5555-4444",
      userId: "usr_1111-2222-3333-4444",
      type: "hotel",
      fromCity: "Taj Palace Jaipur",
      toCity: "Jaipur",
      departureDate: "2026-05-01",
      returnDate: "2026-05-05",
      travellers: { rooms: 1, adults: 2, children: 0 },
      totalAmount: 22000,
      status: "cancelled",
      bookingId: "MMT-HT-998877",
      pnr: "HTL-334455",
      createdAt: new Date(Date.now() - 15 * 86400000)
    }
  ]
}

if (fs.existsSync(DB_FILE)) {
  try {
    const fileData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'))
    // Hydrate dates properly
    if (fileData.users) fileData.users.forEach(u => u.createdAt = new Date(u.createdAt))
    if (fileData.bookings) fileData.bookings.forEach(b => b.createdAt = new Date(b.createdAt))
    defaultData = fileData
  } catch(e) {
    console.error("Failed to load db.json, using defaults.")
  }
} else {
  fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2))
}

// Resilient thread-safe PostgreSQL database simulator for Prisma ORM
export const postgresDB = defaultData;

export const saveMockDb = () => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(postgresDB, null, 2))
  } catch(e) {
    console.error("Failed to save db.json:", e)
  }
}

export const prisma = {
  user: {
    findUnique: async ({ where }) => {
      if (where.email) return postgresDB.users.find(u => u.email === where.email)
      if (where.phone) return postgresDB.users.find(u => u.phone === where.phone)
      if (where.id) return postgresDB.users.find(u => u.id === where.id)
      return null
    },
    create: async ({ data }) => {
      const newUser = { id: 'usr_' + Date.now(), createdAt: new Date(), ...data }
      postgresDB.users.push(newUser)
      return newUser
    }
  },
  booking: {
    findMany: async ({ where }) => {
      if (where && where.userId) {
        return postgresDB.bookings.filter(b => b.userId === where.userId)
      }
      return postgresDB.bookings
    },
    findUnique: async ({ where }) => {
      return postgresDB.bookings.find(b => b.id === where.id || b.bookingId === where.bookingId)
    },
    create: async ({ data }) => {
      const newBooking = { id: 'bkg_' + Date.now(), createdAt: new Date(), status: 'confirmed', ...data }
      postgresDB.bookings.push(newBooking)
      return newBooking
    },
    update: async ({ where, data }) => {
      const b = postgresDB.bookings.find(bkg => bkg.id === where.id)
      if (b && data.status) b.status = data.status
      return b
    }
  }
}
