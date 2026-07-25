import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const generateBookingPDF = async (booking, elementId = 'pdf-content') => {
  try {
    // Try primary ID first, then fallback to alternative ID
    let element = document.getElementById(elementId)
    if (!element && elementId !== 'booking-pdf-container') {
      console.warn(`Element with ID "${elementId}" not found, trying fallback...`)
      element = document.getElementById('booking-pdf-container')
    }
    if (!element && elementId !== 'pdf-content') {
      console.warn(`Fallback element not found, trying primary ID...`)
      element = document.getElementById('pdf-content')
    }

    if (!element) {
      throw new Error(`PDF content element not found. Tried IDs: "${elementId}", "booking-pdf-container", "pdf-content"`)
    }

    if (!booking || typeof booking !== 'object') {
      throw new Error('Invalid booking object provided to PDF generator')
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    })

    const imgData = canvas.toDataURL('image/png')
    const pageWidth = 210
    const pageHeight = 297
    const imgWidth = pageWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    let heightLeft = imgHeight
    let position = 10

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 20

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight)
      heightLeft -= pageHeight - 20
    }

    // Fallback filenames if booking data missing
    const bookingId = booking.bookingId || booking.id || 'booking_' + Date.now()
    const pnr = booking.pnr || booking.refId || 'ticket_' + Math.random().toString(36).substr(2, 9)
    const filename = `${bookingId}_${pnr}.pdf`

    pdf.save(filename)

    return { success: true, filename }
  } catch (error) {
    console.error('Error generating PDF:', error)
    return { success: false, error: error.message }
  }
}

export const downloadTicketPDF = async (booking) => {
  return generateBookingPDF(booking, 'booking-pdf-container')
}
