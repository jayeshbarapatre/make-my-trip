import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export const generateBookingPDF = async (booking, elementId = 'pdf-content') => {
  try {
    const element = document.getElementById(elementId)
    if (!element) {
      console.error(`Element with ID "${elementId}" not found`)
      return
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

    const filename = `${booking.bookingId || 'booking'}_${booking.pnr || 'ticket'}.pdf`
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
