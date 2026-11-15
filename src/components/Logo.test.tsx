import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import Logo from './Logo'

// jsdom has no matchMedia; fake one that answers the reduced-motion query
function mockReducedMotion(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Logo', () => {
  it('shows the wordmark by default', () => {
    render(<Logo />)
    expect(screen.getByText('BodyMap')).toBeInTheDocument()
    expect(screen.getByText('CREW HEALTH')).toBeInTheDocument()
  })

  it('labels the mark for screen readers when shown alone', () => {
    render(<Logo withWordmark={false} />)
    expect(screen.getByRole('img', { name: 'BodyMap' })).toBeInTheDocument()
    expect(screen.queryByText('CREW HEALTH')).not.toBeInTheDocument()
  })

  it('keeps the pin still unless animated', () => {
    mockReducedMotion(false)
    render(<Logo />)
    expect(screen.queryByTestId('logo-pin-moving')).not.toBeInTheDocument()
  })

  it('moves the pin along the orbit when animated', () => {
    mockReducedMotion(false)
    render(<Logo animated />)
    expect(screen.getByTestId('logo-pin-moving')).toBeInTheDocument()
  })

  it('does not animate when the user prefers reduced motion', () => {
    mockReducedMotion(true)
    render(<Logo animated />)
    expect(screen.queryByTestId('logo-pin-moving')).not.toBeInTheDocument()
  })
})
