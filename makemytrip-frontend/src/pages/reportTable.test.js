import { describe, it, expect } from 'vitest'
import { cellValue, filterRows, paginate } from './reportTable'

const COLUMNS = ['bookingId', 'userEmail', 'totalAmount', 'createdAt']

const rows = Array.from({ length: 30 }, (_, i) => ({
  bookingId: `MMT-FL-${i}`,
  userEmail: i % 2 === 0 ? 'ananya.sharma@example.com' : 'rohit.verma@example.com',
  totalAmount: 1000 + i,
  createdAt: { _seconds: 1786460511, _nanoseconds: 0 }
}))

describe('searching the reports table', () => {
  it('matches the text the cell renders, not the raw value', () => {
    // A Firestore timestamp is an object the user never sees. Searching the
    // date as displayed must work; searching the underlying field name must not.
    const rendered = cellValue(rows[0].createdAt)
    expect(rendered).not.toContain('_seconds')

    expect(filterRows(rows, COLUMNS, rendered.slice(0, 6))).toHaveLength(30)
    expect(filterRows(rows, COLUMNS, '_seconds')).toHaveLength(0)
  })

  it('is case insensitive and ignores surrounding space', () => {
    expect(filterRows(rows, COLUMNS, '  ANANYA  ')).toHaveLength(15)
  })

  it('returns every row for an empty query rather than none', () => {
    expect(filterRows(rows, COLUMNS, '')).toHaveLength(30)
    expect(filterRows(rows, COLUMNS, '   ')).toHaveLength(30)
  })

  it('searches across every column, not just the first', () => {
    expect(filterRows(rows, COLUMNS, '1029')).toHaveLength(1)
  })
})

describe('paging the reports table', () => {
  it('slices the requested page', () => {
    const { visible, start, totalPages } = paginate(rows, 2, 25)
    expect(totalPages).toBe(2)
    expect(start).toBe(25)
    expect(visible).toHaveLength(5)
    expect(visible[0].bookingId).toBe('MMT-FL-25')
  })

  it('clamps a page that is past the end instead of showing nothing', () => {
    // The defect this pins: filtering a long report while on a late page left
    // the table blank, because the slice started beyond the last row.
    const narrowed = filterRows(rows, COLUMNS, 'ananya')
    const { currentPage, visible } = paginate(narrowed, 9, 25)

    expect(currentPage).toBe(1)
    expect(visible.length).toBeGreaterThan(0)
  })

  it('reports one page and no rows for an empty result', () => {
    const { currentPage, totalPages, visible } = paginate([], 3, 25)
    expect(currentPage).toBe(1)
    expect(totalPages).toBe(1)
    expect(visible).toHaveLength(0)
  })

  it('never divides by a zero or negative page size', () => {
    expect(paginate(rows, 1, 0).visible.length).toBe(1)
    expect(Number.isFinite(paginate(rows, 1, 0).totalPages)).toBe(true)
  })
})
