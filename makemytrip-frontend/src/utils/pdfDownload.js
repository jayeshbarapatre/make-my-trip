/**
 * Shared html2canvas → jsPDF ticket generator for all confirmation pages.
 *
 * Previously each success page reimplemented this (and they had already
 * drifted: success pages used imgWidth 210, the bus variant used 190). All
 * pages now call this helper with their printable element id and a filename.
 */
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default async function downloadElementAsPdf(elementId, fileName) {
  const element = document.getElementById(elementId)
  if (!element) return

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const imgWidth = 210
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
    pdf.save(fileName)
  } catch (error) {
    console.error('PDF Error:', error)
    alert('Failed to generate PDF')
  }
}
