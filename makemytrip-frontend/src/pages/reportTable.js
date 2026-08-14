// Row rendering, searching and paging for the Reports table.
//
// Extracted from AdminReports so the paging arithmetic can be tested without
// mounting the page. The two rules worth pinning are that a search matches the
// text actually on screen, and that a page number can never point past the end
// of the data — narrowing a report while on a late page used to leave the table
// looking empty when rows were there.

/** The string a cell renders as. Searching matches against this, not the raw value. */
export const cellValue = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  // Firestore timestamps arrive as { _seconds, _nanoseconds }.
  if (typeof v === 'object' && v._seconds) return new Date(v._seconds * 1000).toLocaleString('en-IN')
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

export const filterRows = (rows, columns, query) => {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => columns.some((c) => cellValue(row[c]).toLowerCase().includes(q)))
}

/**
 * Clamps rather than trusting the requested page, so a shrinking result set
 * cannot strand the view past the last row.
 */
export const paginate = (items, page, pageSize) => {
  const size = Math.max(1, Number(pageSize) || 1)
  const totalPages = Math.max(1, Math.ceil(items.length / size))
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages)
  const start = (currentPage - 1) * size

  return { currentPage, totalPages, start, visible: items.slice(start, start + size) }
}
