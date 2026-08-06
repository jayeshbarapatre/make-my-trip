import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import SearchButton from './SearchButton'

/**
 * There were two search buttons — the home page used the design system, the
 * eleven inner pages hand-rolled their own with a hardcoded "SEARCH" no locale
 * could translate. Both are this component now, and these pin the parts that
 * drifted.
 */
describe('SearchButton', () => {
  it('carries the design system base class, not just the colour modifier', () => {
    render(<SearchButton />)
    const btn = screen.getByRole('button')
    // .btn holds the geometry; .btn-primary is colour only. A button with the
    // modifier and no base takes a background and no size — that mismatch was
    // the original defect across 39 buttons.
    expect(btn).toHaveClass('btn')
    expect(btn).toHaveClass('btn-primary')
  })

  it('sits inside the cell wrapper that gives it its height', () => {
    const { container } = render(<SearchButton />)
    const cell = container.querySelector('.search-cta')
    expect(cell).not.toBeNull()
    expect(cell.querySelector('button')).not.toBeNull()
  })

  it('does not set height with a percentage utility', () => {
    render(<SearchButton />)
    // h-full is height:100% on what was a direct grid item — no definite
    // containing block, so it silently fell back to auto.
    expect(screen.getByRole('button').className).not.toMatch(/\bh-full\b/)
  })

  it('renders a translated label by default', () => {
    render(<SearchButton />)
    expect(screen.getByRole('button')).toHaveTextContent(/search/i)
  })

  it('accepts a caller label for the pages that are not searching', () => {
    render(<SearchButton label="Check Visa" />)
    expect(screen.getByRole('button')).toHaveTextContent('Check Visa')
  })

  it('defaults to type=button so it cannot submit a form by accident', () => {
    render(<SearchButton />)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  it('can be a submit button where the strip is a form', () => {
    render(<SearchButton type="submit" />)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
