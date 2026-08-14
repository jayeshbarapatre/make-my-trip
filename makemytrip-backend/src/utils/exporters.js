import ExcelJS from 'exceljs'
import PDFDocument from 'pdfkit'

// Shared table exporters. Every report defines its columns once as
// { key, header, width?, format? } and can then be emitted in any format.

const formatCell = (row, column) => {
  const raw = row[column.key]
  if (raw === null || raw === undefined) return ''
  if (column.format) return column.format(raw, row)
  // Firestore timestamps arrive as objects, not dates.
  if (typeof raw?.toDate === 'function') return raw.toDate().toISOString()
  if (raw instanceof Date) return raw.toISOString()
  if (typeof raw === 'object') return JSON.stringify(raw)
  return String(raw)
}

/**
 * RFC 4180 quoting. A field containing a comma, quote, or newline must be
 * wrapped and its quotes doubled, otherwise a single address field with a comma
 * silently shifts every later column.
 */
const csvEscape = (value) => {
  const s = String(value ?? '')
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export const toCsv = (rows, columns) => {
  const header = columns.map((c) => csvEscape(c.header)).join(',')
  const body = rows.map((row) => columns.map((c) => csvEscape(formatCell(row, c))).join(','))
  // Excel only auto-detects UTF-8 in a CSV when a BOM is present; without it
  // rupee signs and accented names render as mojibake.
  return '﻿' + [header, ...body].join('\r\n') + '\r\n'
}

export const toXlsx = async (rows, columns, { sheetName = 'Report', title = null } = {}) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'TripOra Platform'
  workbook.created = new Date()

  // Excel rejects these characters in a sheet name and caps it at 31 chars.
  const sheet = workbook.addWorksheet(sheetName.replace(/[*?:/\\[\]]/g, '-').slice(0, 31))

  if (title) {
    sheet.mergeCells(1, 1, 1, Math.max(columns.length, 1))
    const cell = sheet.getCell(1, 1)
    cell.value = title
    cell.font = { bold: true, size: 14 }
    sheet.addRow([])
  }

  const headerRow = sheet.addRow(columns.map((c) => c.header))
  headerRow.font = { bold: true }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003580' } }
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }

  for (const row of rows) {
    sheet.addRow(columns.map((c) => {
      const raw = row[c.key]
      // Numeric columns stay numeric in Excel. Writing the display string here
      // instead would leave the user unable to sum, sort, or chart the column —
      // the whole reason for offering xlsx over csv.
      if (c.numeric && raw !== null && raw !== undefined && raw !== '') {
        const n = Number(raw)
        if (Number.isFinite(n)) return n
      }
      if (!c.format && typeof raw === 'number') return raw
      return formatCell(row, c)
    }))
  }

  columns.forEach((c, i) => {
    const column = sheet.getColumn(i + 1)
    column.width = c.width ?? Math.max(12, Math.min(40, c.header.length + 6))
    if (c.numeric) column.numFmt = c.numFmt ?? '#,##0.00'
  })

  sheet.views = [{ state: 'frozen', ySplit: title ? 3 : 1 }]

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

export const toPdf = (rows, columns, { title = 'Report', subtitle = null } = {}) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 })
    const chunks = []

    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(16).fillColor('#003580').text(title, { align: 'left' })
    if (subtitle) doc.moveDown(0.2).fontSize(9).fillColor('#666').text(subtitle)
    doc.moveDown(0.6)

    const usable = doc.page.width - doc.options.margin * 2
    const totalWeight = columns.reduce((sum, c) => sum + (c.width ?? 12), 0)
    const widths = columns.map((c) => ((c.width ?? 12) / totalWeight) * usable)

    const drawRow = (values, { bold = false, fill = null } = {}) => {
      const top = doc.y
      const heights = values.map((v, i) =>
        doc.fontSize(8).heightOfString(String(v ?? ''), { width: widths[i] - 8 })
      )
      const rowHeight = Math.max(14, ...heights) + 6

      // Start a new page before the row is drawn, never mid-row.
      if (top + rowHeight > doc.page.height - doc.options.margin) {
        doc.addPage()
      }

      const y = doc.y
      if (fill) {
        doc.rect(doc.options.margin, y, usable, rowHeight).fill(fill)
      }

      let x = doc.options.margin
      values.forEach((v, i) => {
        doc
          .fillColor(bold ? '#ffffff' : '#222')
          .fontSize(8)
          .text(String(v ?? ''), x + 4, y + 4, { width: widths[i] - 8, height: rowHeight - 6, ellipsis: true })
        x += widths[i]
      })

      doc.y = y + rowHeight
    }

    drawRow(columns.map((c) => c.header), { bold: true, fill: '#003580' })

    if (!rows.length) {
      doc.moveDown(1).fillColor('#666').fontSize(10).text('No records for the selected period.')
    } else {
      rows.forEach((row) => drawRow(columns.map((c) => formatCell(row, c))))
    }

    doc
      .moveDown(1)
      .fillColor('#888')
      .fontSize(7)
      .text(`${rows.length} record(s) · generated ${new Date().toISOString()}`, { align: 'right' })

    doc.end()
  })

export const CONTENT_TYPES = {
  csv: 'text/csv; charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pdf: 'application/pdf'
}

/** Streams a report in the requested format with the right download headers. */
export const sendExport = async (res, { format, rows, columns, filename, title, subtitle }) => {
  const safeName = `${filename}-${new Date().toISOString().slice(0, 10)}`

  if (format === 'csv') {
    res.setHeader('Content-Type', CONTENT_TYPES.csv)
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.csv"`)
    return res.send(toCsv(rows, columns))
  }

  if (format === 'xlsx') {
    const buffer = await toXlsx(rows, columns, { sheetName: title ?? 'Report', title })
    res.setHeader('Content-Type', CONTENT_TYPES.xlsx)
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.xlsx"`)
    return res.send(buffer)
  }

  if (format === 'pdf') {
    const buffer = await toPdf(rows, columns, { title: title ?? 'Report', subtitle })
    res.setHeader('Content-Type', CONTENT_TYPES.pdf)
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}.pdf"`)
    return res.send(buffer)
  }

  return res.json({ success: true, data: rows, count: rows.length })
}
