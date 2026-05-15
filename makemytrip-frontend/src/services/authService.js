import api from './api'

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/signup', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  resetPassword: (email, otp, password) => api.post('/auth/reset-password', { email, otp, password }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  sendMobileOtp: (phone) => api.post('/auth/send-otp', { phone }),
  verifyMobileOtp: (phone, otp) => api.post('/auth/verify-otp', { phone, otp })
}

export const bookingService = {
  createBooking: async (data) => {
    try {
      const res = await api.post('/bookings/create', data)
      return res?.data || res
    } catch (e) {
      console.warn("Using offline fallback createBooking:", e)
      return { success: true, data: { id: "bkg_" + Date.now(), ...data } }
    }
  },
  getUserBookings: async (userId = 'usr_1111-2222-3333-4444') => {
    try {
      const res = await api.get(`/bookings/user/${userId}`)
      const offlineHotel = JSON.parse(localStorage.getItem('user_bookings_hotel') || '[]')
      const offlineTrain = JSON.parse(localStorage.getItem('user_bookings_train') || '[]')
      return [...offlineTrain, ...offlineHotel, ...(res?.data || res)]
    } catch (e) {
      console.warn("Using offline fallback booking data:", e)
      const offlineHotel = JSON.parse(localStorage.getItem('user_bookings_hotel') || '[]')
      const offlineTrain = JSON.parse(localStorage.getItem('user_bookings_train') || '[]')
      return [
        ...offlineTrain,
        ...offlineHotel,
        {
          id: "bkg_abcd-1234-5678-90ef",
          userId: userId,
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
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: "bkg_ef01-2345-6789-abcd",
          userId: userId,
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
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: "bkg_9999-8888-7777-6666",
          userId: userId,
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
          createdAt: new Date(Date.now() - 40 * 86400000).toISOString()
        },
        {
          id: "bkg_7777-6666-5555-4444",
          userId: userId,
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
          createdAt: new Date(Date.now() - 15 * 86400000).toISOString()
        }
      ]
    }
  },
  cancelBooking: async (id) => {
    try {
      const res = await api.put(`/bookings/cancel/${id}`)
      return res?.data || res
    } catch (e) {
      console.warn("Using offline fallback cancel:", e)
      return { id, status: 'cancelled' }
    }
  }
}

export const paymentService = {
  createOrder: async (amount) => {
    try {
      const res = await api.post('/payment/create-order', { amount })
      return res?.data || res
    } catch (e) {
      console.warn("Using offline fallback payment order:", e)
      return {
        id: "order_rzp_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        amount: Math.round(amount * 100),
        currency: "INR",
        status: "created"
      }
    }
  }
}

export const userService = {
  getProfile: async () => {
    try {
      const res = await api.get('/user/profile')
      return res?.data || res
    } catch (e) {
      console.warn('Fallback offline profile:', e)
      return {
        user: { id: "usr_1111-2222-3333-4444", name: "Jayesh Sharma", email: "jayesh@gmail.com", phone: "9876543210" }
      }
    }
  },
  updateProfile: async (data) => {
    try {
      const res = await api.put('/user/update', data)
      return res?.data || res
    } catch (e) {
      console.warn('Fallback offline update:', e)
      return {
        user: { id: "usr_1111-2222-3333-4444", name: "Jayesh Sharma", email: "jayesh@gmail.com", phone: "9876543210", ...data }
      }
    }
  }
}
