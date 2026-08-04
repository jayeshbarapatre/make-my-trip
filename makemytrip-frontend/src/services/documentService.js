const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1'

// Booking documents are rendered by the backend from the stored record.
//
// These used to be produced in the browser with html2canvas + jsPDF, which
// screenshots whatever is currently on screen: the text is not selectable, the
// layout depends on the viewport, and there is no invoice number because the
// browser has no authority to issue one. The server renders from the booking
// itself, so a document can be re-issued at any time and always matches.

const download = async (path, fallbackName) => {
  const token = localStorage.getItem('token')

  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })

  if (!res.ok) {
    // The API returns JSON on failure even though the happy path is a PDF.
    let message = 'Could not generate the document'
    try {
      message = (await res.json()).message || message
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  const suggested = /filename="([^"]+)"/.exec(res.headers.get('Content-Disposition') || '')?.[1]

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggested || fallbackName
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export const documentService = {
  downloadTicket: (bookingDocId) =>
    download(`/documents/bookings/${bookingDocId}/ticket`, `ticket-${bookingDocId}.pdf`),

  downloadInvoice: (bookingDocId) =>
    download(`/documents/bookings/${bookingDocId}/invoice`, `invoice-${bookingDocId}.pdf`),

  downloadRefundReceipt: (refundDocId) =>
    download(`/documents/refunds/${refundDocId}/receipt`, `refund-${refundDocId}.pdf`)
}

export default documentService
