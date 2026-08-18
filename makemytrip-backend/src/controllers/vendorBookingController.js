import { db } from '../config/firebase.js'
import { byNewest } from '../utils/time.js'

export const getVendorBookings = async (req, res) => {
  try {
    const vendorId = req.vendorId

    if (!vendorId) {
      return res.status(403).json({ message: 'Forbidden: Vendor ID is required' })
    }

    console.log(`📋 Fetching bookings for vendor ${vendorId}`)

    const bookingsSnapshot = await db.collection('bookings')
      .where('vendorId', '==', vendorId)
      .get()

    const bookings = bookingsSnapshot.docs
      .map(doc => ({
        bookingId: doc.id,
        ...doc.data()
      }))
      .sort(byNewest('createdAt'))

    console.log(`✅ Found ${bookings.length} bookings for vendor ${vendorId}`)

    res.json({ success: true, data: bookings })
  } catch (err) {
    console.error('Get vendor bookings error:', err.message)
    res.status(500).json({ message: 'Could not load your bookings. Please try again.' })
  }
}
