import React from 'react'
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import ErrorBoundary from '../../src/components/ErrorBoundary'

describe('ErrorBoundary Component', () => {
  const originalError = console.error

  beforeAll(() => {
    console.error = vi.fn()
  })

  afterAll(() => {
    console.error = originalError
  })

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div data-testid="child">Test Child</div>
      </ErrorBoundary>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Test Child')).toBeInTheDocument()
  })

  it('should render error page when child throws error', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument()
  })

  it('should show go home button', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const homeButton = screen.getByText(/Go to Home Page/i)
    expect(homeButton).toBeInTheDocument()
  })

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'

    const ThrowError = () => {
      throw new Error('Development test error')
    }

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    // In development, error details should be visible
    expect(screen.getByText(/Error details/i)).toBeInTheDocument()

    process.env.NODE_ENV = originalEnv
  })
})
