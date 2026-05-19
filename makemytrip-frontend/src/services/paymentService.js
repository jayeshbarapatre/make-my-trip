import api from './api'

const paymentService = {
  createOrder: async (amount, notes = {}) => {
    const response = await api.post('/payment/create-order', {
      amount,
      currency: 'INR',
      notes
    })
    return response.data
  },

  verifyPayment: async (orderId, paymentId, signature) => {
    const response = await api.post('/payment/verify', {
      orderId,
      paymentId,
      signature
    })
    return response.data
  }
}

export default paymentService
