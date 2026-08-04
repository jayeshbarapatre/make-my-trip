import PDFDocument from 'pdfkit'

const BRAND_COLOR = '#003580'
const ACCENT_COLOR = '#e63946'

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
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
  doc.text('MakeMyTrip', 50, 20)
  doc.font('Helvetica', 12)
  doc.text(title, 50, 50, { width: 300 })
  doc.fillColor('black')
  doc.moveDown(2)
}

const addFooter = (doc) => {
  doc.fontSize(10)
  doc.fillColor('#666')
  doc.text('© 2024 MakeMyTrip. All rights reserved.', 50, doc.page.height - 30, { align: 'center' })
  doc.text('This is an automated document. Please keep for your records.', 50, doc.page.height - 15, { align: 'center' })
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
      doc.text('MakeMyTrip', 50, 20)
      doc.font('Helvetica', 14)
      doc.text('INVOICE', 50, 50)
      doc.fillColor('black')
      doc.moveDown(2)

      // Invoice Details
      doc.fontSize(10)
      doc.text(`Invoice Number: ${invoiceNumber}`)
      doc.text(`Booking ID: ${booking.bookingId}`)
      doc.text(`Date: ${formatDate(new Date().toISOString())}`)
      doc.moveDown(1)

      // Bill To
      doc.fontSize(12).fillColor(BRAND_COLOR).text('Bill To:')
      doc.fontSize(10).fillColor('black')
      doc.text('Customer')
      doc.text(`Email: ${booking.userEmail || 'N/A'}`)
      doc.moveDown(1)

      // Items Table Header
      const itemsTableX = 50
      const itemsWidth = 500
      const col1 = 250
      const col2 = 100
      const col3 = 150

      doc.rect(itemsTableX, doc.y, itemsWidth, 25).fill('#f0f0f0')
      doc.fillColor('black').fontSize(11).font('Helvetica-Bold')
      doc.text('Description', itemsTableX + 10, doc.y + 5, { width: col1 - 20 })
      doc.text('Qty', itemsTableX + col1 + 10, doc.y - 20, { width: col2 - 20 })
      doc.text('Amount', itemsTableX + col1 + col2 + 10, doc.y - 20, { width: col3 - 20 })

      doc.moveDown(2)

      // Items
      const items = [
        [`${String(booking.type ?? "Booking").toUpperCase()} Booking (${booking.bookingId ?? "—"})`, '1', formatCurrency(booking.baseFare || 0)]
      ]

      items.forEach(([desc, qty, amount]) => {
        doc.rect(itemsTableX, doc.y, itemsWidth, 20).stroke()
        doc.fontSize(10).fillColor('black').font('Helvetica')
        doc.text(desc, itemsTableX + 10, doc.y + 3, { width: col1 - 20 })
        doc.text(qty, itemsTableX + col1 + 10, doc.y - 17, { width: col2 - 20 })
        doc.text(amount, itemsTableX + col1 + col2 + 10, doc.y - 17, { width: col3 - 20 })
        doc.moveDown(1.5)
      })

      doc.moveDown(1)

      // Totals Section
      doc.rect(itemsTableX + col1, doc.y, col2 + col3, 20).fill('#f0f0f0')
      doc.fillColor('black').fontSize(11).font('Helvetica-Bold')
      doc.text('Subtotal', itemsTableX + col1 + 10, doc.y + 3, { width: col2 - 20 })
      doc.text(formatCurrency(booking.baseFare || 0), itemsTableX + col1 + col2 + 10, doc.y - 17, { width: col3 - 20 })
      doc.moveDown(1.5)

      const taxRows = [
        ['Taxes', formatCurrency(booking.taxes || 0)],
        ['Convenience Fee', formatCurrency(booking.convenience || 0)],
        ['GST', formatCurrency(booking.gst || 0)]
      ]

      taxRows.forEach(([label, amount]) => {
        doc.fontSize(10).fillColor('black').font('Helvetica')
        doc.text(label, itemsTableX + col1 + 10, undefined, { width: col2 - 20 })
        doc.text(amount, itemsTableX + col1 + col2 + 10, doc.y - 15, { width: col3 - 20 })
        doc.moveDown(1.2)
      })

      doc.rect(itemsTableX + col1, doc.y, col2 + col3, 25).fill(ACCENT_COLOR)
      doc.fillColor('white').fontSize(12).font('Helvetica-Bold')
      doc.text('TOTAL', itemsTableX + col1 + 10, doc.y + 5, { width: col2 - 20 })
      doc.text(formatCurrency(booking.totalAmount || 0), itemsTableX + col1 + col2 + 10, doc.y - 20, { width: col3 - 20 })

      doc.moveDown(3)

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
