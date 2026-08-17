import PDFDocument from 'pdfkit'
import { DEMO_MODE, DEMO_NOTICE, DEMO_BANNER } from '../../config/demoMode.js'

const BRAND_COLOR = '#003580'
const ACCENT_COLOR = '#e63946'

const formatCurrency = (amount) => {
  return 'Rs. ' + new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

const addHeader = (doc, title) => {
  doc.rect(0, 0, doc.page.width, 80).fill(BRAND_COLOR)
  doc.font('Helvetica-Bold', 24)
  doc.fillColor('white')
  doc.text('TripOra', 50, 20)
  doc.font('Helvetica', 12)
  doc.text(title, 50, 50, { width: 300 })
  doc.fillColor('black')
  doc.moveDown(2)
}

/**
 * States plainly that the document is not a reservation.
 *
 * A PDF ticket is the artifact most likely to be mistaken for the real thing:
 * it leaves the site, gets forwarded and printed, and arrives without any of
 * the context that makes a demo obviously a demo. So the disclosure goes at the
 * top, before the PNR and the route, not in small print at the bottom.
 */
const addDemoBanner = (doc) => {
  if (!DEMO_MODE) return

  const y = doc.y
  doc.rect(40, y, doc.page.width - 80, 26).fill('#fff4e5')
  doc.rect(40, y, 4, 26).fill('#e67700')
  doc.font('Helvetica-Bold', 10).fillColor('#8a4b00')
  doc.text(DEMO_BANNER, 54, y + 8, { width: doc.page.width - 110 })
  doc.font('Helvetica', 10).fillColor('black')
  doc.y = y + 26
  doc.moveDown(1)
}

const addFooter = (doc) => {
  doc.fontSize(10)
  doc.fillColor('#666')

  const footerY = doc.page.height - 50;

  if (DEMO_MODE) {
    doc.fontSize(7)
    doc.text(DEMO_NOTICE, 50, footerY - 20, {
      align: 'center',
      width: doc.page.width - 100,
      lineBreak: false
    })
    doc.fontSize(10)
  }

  doc.text('© 2024 TripOra. All rights reserved.', 50, footerY, { align: 'center', lineBreak: false })
  doc.text('This is an automated document. Please keep for your records.', 50, footerY + 15, { align: 'center', lineBreak: false })
}

const addTable = (doc, rows, options = {}) => {
  const startX = options.startX || 50
  const startY = doc.y
  const width = options.width || 500
  const rowHeight = options.rowHeight || 30
  const colWidths = options.colWidths || [width / 2, width / 2]

  rows.forEach((row, rowIndex) => {
    const y = startY + rowIndex * rowHeight

    if (rowIndex === 0 && options.headerBg) {
      doc.rect(startX, y, width, rowHeight).fill(options.headerBg)
    }

    let currentX = startX
    row.forEach((cell, colIndex) => {
      doc.fillColor(rowIndex === 0 ? 'white' : 'black')
      doc.fontSize(rowIndex === 0 ? 11 : 10)
      const cellWidth = colWidths[colIndex]
      doc.text(cell, currentX + 5, y + 8, { width: cellWidth - 10, height: rowHeight - 4 })
      currentX += cellWidth
    })

    doc.rect(startX, y, width, rowHeight).stroke()
  })

  doc.moveDown(rows.length + 2)
}

export const generateTicketPDF = async (booking) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const chunks = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      addHeader(doc, `${String(booking.type ?? "booking").toUpperCase()} TICKET`)
      addDemoBanner(doc)

      // Booking Details
      doc.fontSize(14).fillColor(BRAND_COLOR).text('Booking Details')
      doc.moveDown(0.5)

      const bookingRows = [
        ['Booking ID:', booking.bookingId],
        ['PNR/Reference:', booking.pnr || 'N/A'],
        ['Booking Status:', booking.status ? booking.status.toUpperCase() : 'CONFIRMED'],
        ['Date:', formatDate(booking.createdAt)]
      ]

      bookingRows.forEach(([label, value]) => {
        doc.fontSize(10).fillColor('black')
        doc.text(label, 50, undefined, { width: 150 })
        doc.fontSize(10).text(value, 200, doc.y - 15, { width: 300 })
        doc.moveDown(0.8)
      })

      doc.moveDown(1)

      // Journey/Route Details
      if (booking.type === 'flight') {
        doc.fontSize(14).fillColor(BRAND_COLOR).text('Flight Details')
        doc.moveDown(0.5)

        const flightRows = [
          ['Airline:', booking.airlineName || 'N/A'],
          ['Flight Number:', booking.flightNumber || 'N/A'],
          ['From:', booking.fromCity],
          ['To:', booking.toCity],
          ['Departure:', `${formatDate(booking.departureDate)} at ${booking.departureTime || 'N/A'}`],
          ['Arrival:', booking.arrivalTime || 'N/A'],
          ['Passengers:', booking.travellers?.passengers?.length || 1]
        ]

        flightRows.forEach(([label, value]) => {
          doc.fontSize(10).fillColor('black')
          doc.text(label, 50, undefined, { width: 150 })
          doc.text(value, 200, doc.y - 15, { width: 300 })
          doc.moveDown(0.8)
        })
      } else if (booking.type === 'hotel') {
        doc.fontSize(14).fillColor(BRAND_COLOR).text('Hotel Details')
        doc.moveDown(0.5)

        const hotelRows = [
          ['Hotel:', booking.hotelName || booking.fromCity || 'N/A'],
          ['Location:', booking.hotelLocality || booking.hotelAddress || booking.toCity || 'N/A'],
          ['Check-in:', formatDate(booking.checkIn || booking.departureDate)],
          ['Check-out:', formatDate(booking.checkOut || booking.returnDate)],
          ['Rooms:', booking.rooms || 1],
          ['Nights:', booking.nights || booking.numBags || 1]
        ]

        hotelRows.forEach(([label, value]) => {
          doc.fontSize(10).fillColor('black')
          doc.text(label, 50, undefined, { width: 150 })
          doc.text(value, 200, doc.y - 15, { width: 300 })
          doc.moveDown(0.8)
        })

        // Who is checking in. A hotel ticket that names nobody is not much use
        // at a reception desk, and until now the booking carried no names to
        // print — only a room count.
        const guests = booking.guestDetails ?? booking.travellers?.guests ?? []
        if (Array.isArray(guests) && guests.length) {
          doc.moveDown(0.5)
          doc.fontSize(12).fillColor(BRAND_COLOR).text('Guests')
          doc.moveDown(0.4)

          guests.forEach((g, i) => {
            const parts = [g.age ? `${g.age} yrs` : null, g.gender || null].filter(Boolean)
            doc.fontSize(10).fillColor('black')
            doc.text(
              `${i + 1}. ${g.name || 'Guest'}${parts.length ? `  (${parts.join(', ')})` : ''}`,
              50,
              undefined,
              { width: 450 }
            )
            doc.moveDown(0.5)
          })
        }
      } else if (booking.type === 'train') {
        doc.fontSize(14).fillColor(BRAND_COLOR).text('Train Details')
        doc.moveDown(0.5)

        const trainRows = [
          ['Train:', booking.trainName || 'N/A'],
          ['Train Number:', booking.trainNumber || 'N/A'],
          ['From:', booking.fromCity || booking.from || 'N/A'],
          ['To:', booking.toCity || booking.to || 'N/A'],
          ['Date:', formatDate(booking.travelDate || booking.departureDate)],
          ['Class:', booking.travelClass || booking.coachClass || 'N/A'],
          ['Passengers:', booking.paxCount || 1]
        ]

        trainRows.forEach(([label, value]) => {
          doc.fontSize(10).fillColor('black')
          doc.text(label, 50, undefined, { width: 150 })
          doc.text(value, 200, doc.y - 15, { width: 300 })
          doc.moveDown(0.8)
        })
      } else if (booking.type === 'bus') {
        doc.fontSize(14).fillColor(BRAND_COLOR).text('Bus Details')
        doc.moveDown(0.5)

        const busRows = [
          ['Operator:', booking.busOperator || 'N/A'],
          ['Bus Type:', booking.busType || 'N/A'],
          ['From:', booking.fromCity || booking.from || 'N/A'],
          ['To:', booking.toCity || booking.to || 'N/A'],
          ['Date:', formatDate(booking.travelDate || booking.departureDate)],
          ['Boarding Point:', booking.boardingPoint || 'N/A'],
          ['Dropping Point:', booking.droppingPoint || 'N/A'],
          ['Passengers:', booking.paxCount || 1]
        ]

        busRows.forEach(([label, value]) => {
          doc.fontSize(10).fillColor('black')
          doc.text(label, 50, undefined, { width: 150 })
          doc.text(value, 200, doc.y - 15, { width: 300 })
          doc.moveDown(0.8)
        })
      } else if (booking.type === 'cab') {
        doc.fontSize(14).fillColor(BRAND_COLOR).text('Cab Details')
        doc.moveDown(0.5)

        const cabRows = [
          ['Cab Type:', booking.cabType || 'N/A'],
          ['Pickup Location:', booking.pickupLocation || booking.from || 'N/A'],
          ['Drop Location:', booking.dropLocation || booking.to || 'N/A'],
          ['Date:', formatDate(booking.travelDate || booking.departureDate)],
          ['Distance:', booking.distance || 'N/A'],
          ['Driver:', booking.driverName || 'Will be allocated shortly']
        ]

        cabRows.forEach(([label, value]) => {
          doc.fontSize(10).fillColor('black')
          doc.text(label, 50, undefined, { width: 150 })
          doc.text(value, 200, doc.y - 15, { width: 300 })
          doc.moveDown(0.8)
        })
      }

      doc.moveDown(1)

      // Fare Summary
      doc.fontSize(14).fillColor(BRAND_COLOR).text('Fare Summary')
      doc.moveDown(0.5)

      const fareRows = [
        ['Base Fare:', formatCurrency(booking.baseFare || 0)],
        ['Taxes & Fees:', formatCurrency(booking.taxes || 0)],
        ['Convenience Fee:', formatCurrency(booking.convenience || 0)],
        ['Discount:', formatCurrency(booking.discount || 0)],
        ['GST:', formatCurrency(booking.gst || 0)],
        ['TOTAL:', formatCurrency(booking.totalAmount || 0)]
      ]

      fareRows.forEach(([label, value], index) => {
        doc.fontSize(index === fareRows.length - 1 ? 12 : 10)
        doc.fillColor(index === fareRows.length - 1 ? ACCENT_COLOR : 'black')
        if (index === fareRows.length - 1) {
          doc.font('Helvetica-Bold')
        }
        doc.text(label, 50, undefined, { width: 150 })
        doc.text(value, 200, doc.y - 15, { width: 300 })
        doc.moveDown(0.8)
      })

      doc.moveDown(2)

      // Footer
      addFooter(doc)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export const generateInvoicePDF = async (booking, invoiceNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40 })
      const chunks = []

      doc.on('data', (chunk) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // Header
      doc.rect(0, 0, doc.page.width, 80).fill(BRAND_COLOR)
      doc.font('Helvetica-Bold', 24)
      doc.fillColor('white')
      doc.text('TripOra', 50, 20)
      doc.font('Helvetica', 14)
      doc.text('INVOICE', 50, 50)
      doc.fillColor('black')
      doc.moveDown(2)
      addDemoBanner(doc)

      // Invoice Details
      doc.fontSize(10)
      doc.text(`Invoice Number: ${invoiceNumber}`)
      doc.text(`Booking ID: ${booking.bookingId}`)
      doc.text(`Date: ${formatDate(new Date().toISOString())}`)
      doc.moveDown(1)

      // Bill To
      doc.fontSize(12).fillColor(BRAND_COLOR).text('Bill To:')
      doc.fontSize(10).fillColor('black')
      const customerName = booking.guestDetails?.[0]?.name || booking.userName || booking.contact?.name || 'Customer'
      doc.text(customerName)
      doc.text(`Email: ${booking.userEmail || 'N/A'}`)
      doc.moveDown(1)

      // Items Table Header
      const itemsTableX = 50
      const itemsWidth = 500
      const col1 = 250
      const col2 = 100
      const col3 = 150

      const headerY = doc.y;
      doc.rect(itemsTableX, headerY, itemsWidth, 25).fill('#f0f0f0')
      doc.fillColor('black').fontSize(11).font('Helvetica-Bold')
      doc.text('Description', itemsTableX + 10, headerY + 8, { width: col1 - 20, lineBreak: false })
      doc.text('Qty', itemsTableX + col1 + 10, headerY + 8, { width: col2 - 20, lineBreak: false })
      doc.text('Amount', itemsTableX + col1 + col2 + 10, headerY + 8, { width: col3 - 20, lineBreak: false })

      doc.y = headerY + 25 + 10;

      // Items
      const items = [
        [`${String(booking.type ?? "Booking").toUpperCase()} Booking (${booking.bookingId ?? "—"})`, '1', formatCurrency(booking.baseFare || 0)]
      ]

      items.forEach(([desc, qty, amount]) => {
        const itemY = doc.y;
        doc.rect(itemsTableX, itemY, itemsWidth, 20).stroke()
        doc.fontSize(10).fillColor('black').font('Helvetica')
        doc.text(desc, itemsTableX + 10, itemY + 5, { width: col1 - 20, lineBreak: false })
        doc.text(qty, itemsTableX + col1 + 10, itemY + 5, { width: col2 - 20, lineBreak: false })
        doc.text(amount, itemsTableX + col1 + col2 + 10, itemY + 5, { width: col3 - 20, lineBreak: false })
        doc.y = itemY + 20 + 5;
      })

      doc.moveDown(1)

      // Totals Section
      const totalStartY = doc.y;
      doc.rect(itemsTableX + col1, totalStartY, col2 + col3, 20).fill('#f0f0f0')
      doc.fillColor('black').fontSize(11).font('Helvetica-Bold')
      doc.text('Subtotal', itemsTableX + col1 + 10, totalStartY + 5, { width: col2 - 20, lineBreak: false })
      doc.text(formatCurrency(booking.baseFare || 0), itemsTableX + col1 + col2 + 10, totalStartY + 5, { width: col3 - 20, lineBreak: false })
      doc.y = totalStartY + 20 + 5;

      const taxRows = [
        ['Taxes', formatCurrency(booking.taxes || 0)],
        ['Convenience Fee', formatCurrency(booking.convenience || 0)],
        ['GST', formatCurrency(booking.gst || 0)]
      ]

      taxRows.forEach(([label, amount]) => {
        const taxY = doc.y;
        doc.fontSize(10).fillColor('black').font('Helvetica')
        doc.text(label, itemsTableX + col1 + 10, taxY, { width: col2 - 20, lineBreak: false })
        doc.text(amount, itemsTableX + col1 + col2 + 10, taxY, { width: col3 - 20, lineBreak: false })
        doc.y = taxY + 15;
      })

      const finalTotalY = doc.y;
      doc.rect(itemsTableX + col1, finalTotalY, col2 + col3, 25).fill(ACCENT_COLOR)
      doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
      doc.text('TOTAL', itemsTableX + col1 + 10, finalTotalY + 7, { width: col2 - 20, lineBreak: false })
      doc.text(formatCurrency(booking.totalAmount || 0), itemsTableX + col1 + col2 + 10, finalTotalY + 7, { width: col3 - 20, lineBreak: false })

      doc.y = finalTotalY + 25 + 30;

      // Payment Info
      doc.fontSize(10).fillColor('black')
      doc.text(`Payment Method: ${booking.paymentMethod || 'Not specified'}`)
      doc.text(`Payment Status: ${booking.paymentStatus || 'Pending'}`)
      if (booking.transactionId) {
        doc.text(`Transaction ID: ${booking.transactionId}`)
      }

      doc.moveDown(2)

      // Footer
      addFooter(doc)

      doc.end()
    } catch (error) {
      reject(error)
    }
  })
}

export default {
  generateTicketPDF,
  generateInvoicePDF
}
