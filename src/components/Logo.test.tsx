import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Logo from './Logo'

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
})
