import React from 'react'
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import LoadingSkeleton, { FlightCardSkeleton, HotelCardSkeleton, TableRowSkeleton } from '../../src/components/LoadingSkeleton'

describe('LoadingSkeleton Components', () => {
  describe('FlightCardSkeleton', () => {
    it('should render flight skeleton with placeholder content', () => {
      const { container } = render(<FlightCardSkeleton />)
      const divs = container.querySelectorAll('div[style*="animation"]')
      expect(divs.length).toBeGreaterThan(0)
    })

    it('should have animating elements', () => {
      const { container } = render(<FlightCardSkeleton />)
      const animatedElements = container.querySelectorAll('[style*="animation"]')
      expect(animatedElements.length).toBeGreaterThan(0)
    })
  })

  describe('HotelCardSkeleton', () => {
    it('should render hotel skeleton with placeholder content', () => {
      const { container } = render(<HotelCardSkeleton />)
      const divs = container.querySelectorAll('div[style*="animation"]')
      expect(divs.length).toBeGreaterThan(0)
    })

    it('should have animated divs', () => {
      const { container } = render(<HotelCardSkeleton />)
      const animatedElements = container.querySelectorAll('[style*="animation"]')
      expect(animatedElements.length).toBeGreaterThan(0)
    })
  })

  describe('TableRowSkeleton', () => {
    it('should render table row skeleton', () => {
      const { container } = render(<TableRowSkeleton columns={5} />)
      const cells = container.querySelectorAll('td')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('should render correct number of columns', () => {
      const columnCount = 4
      const { container } = render(<TableRowSkeleton columns={columnCount} />)
      const cells = container.querySelectorAll('td')
      expect(cells.length).toBe(columnCount)
    })

    it('should have animated loading effect', () => {
      const { container } = render(<TableRowSkeleton columns={3} />)
      const animatedElements = container.querySelectorAll('[style*="animation"]')
      expect(animatedElements.length).toBeGreaterThan(0)
    })
  })

  describe('LoadingSkeleton Default', () => {
    it('should render default loading skeleton', () => {
      const { container } = render(<LoadingSkeleton />)
      const divs = container.querySelectorAll('div[style*="animation"]')
      expect(divs.length).toBeGreaterThan(0)
    })
  })
})
