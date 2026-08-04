import api from './api'

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/signup', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp, purpose: 'password_reset' }),
  resetPassword: (email, otp, password) => api.post('/auth/reset-password', { email, otp, password }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout'),
  // Ends every session for the account, for "sign out of all devices".
  logoutEverywhere: () => api.post('/auth/logout', { everywhere: true }),
  listSessions: () => api.get('/auth/sessions'),

  // Mobile OTP
  sendMobileOtp: (phone) => api.post('/auth/send-otp', { phone }),
  resendMobileOtp: (phone) => api.post('/auth/resend-otp', { phone }),
  verifyMobileOtp: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),

  // Email OTP (passwordless)
  sendEmailOtp: (email) => api.post('/auth/send-email-otp', { email }),
  resendEmailOtp: (email) => api.post('/auth/resend-email-otp', { email }),
  verifyEmailOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),

  // Which delivery channels the server can actually use
  otpStatus: () => api.get('/auth/otp-status')
}

export const bookingService = {
  createBooking: async (data) => {
    try {
      const res = await api.post('/bookings/create', data)
      return res?.data || res
    } catch (e) {
      console.error("Booking creation failed:", e)
      throw e
    }
  },
  createBusBooking: async (data) => {
    try {
      const res = await api.post('/bookings/buses', data)
      return res?.data || res
    } catch (e) {
      console.error("Bus booking creation failed:", e)
      throw e
    }
  },
  getUserBookings: async (userId) => {
    try {
      const res = await api.get(`/bookings/user/${userId}`)
      return res?.data || res || []
    } catch (e) {
      console.error("Failed to fetch bookings:", e)
      throw e
    }
  },
  getBooking: async (bookingId) => {
    const res = await api.get(`/bookings/${bookingId}`)
    return res?.data || res
  },
  // Must surface failure: returning a synthetic cancelled record told the user
  // their booking was cancelled when the server had not cancelled anything.
  // Returns the whole envelope, not just .data — the refund quote the server
  // computed travels alongside the updated booking.
  cancelBooking: async (id, reason) => api.put(`/bookings/cancel/${id}`, { reason }),
  previewRefund: (bookingId) => api.get(`/refunds/preview/${bookingId}`),
  listMyRefunds: () => api.get('/refunds/mine'),
  verifyBusPayment: async (paymentData) => {
    // Payment verification must never silently succeed on network failure.
    // A failed verification means the booking must NOT be created.
    const res = await api.post('/payment/verify', paymentData)
    return res?.data || res
  }
}

export const paymentService = {
  createOrder: async (amount) => {
    // Payment order creation must never silently use a fake order on failure.
    // If the server is unavailable, the user must be shown an error.
    const res = await api.post('/payment/create-order', { amount })
    return res?.data || res
  }
}

export const userService = {
  getProfile: async () => {
    const res = await api.get('/user/profile')
    return res?.data || res
  },
  updateProfile: async (data) => {
    const res = await api.put('/user/update', data)
    return res?.data || res
  }
}

