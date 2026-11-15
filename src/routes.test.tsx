import { render, screen } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from './routes'

// Render the app at a given address, without a real browser URL
function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(<RouterProvider router={router} />)
  return router
}

describe('routes', () => {
  it.each([
    ['/', 'Body Map'],
    ['/check-in', 'Daily check-in'],
    ['/routine', 'Routine'],
    ['/setup', 'Crew & mission setup'],
    ['/about', 'About'],
  ])('%s shows the %s page', (path, title) => {
    renderAt(path)
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeInTheDocument()
  })

  it('opens System detail as a panel over the Body Map, for the system in the address', () => {
    renderAt('/system/immune')
    expect(screen.getByRole('dialog', { name: 'Immune system' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Body Map' })).toBeInTheDocument()
  })

  it('sends an unknown system back to the Body Map', async () => {
    const router = renderAt('/system/liver')
    expect(await screen.findByRole('heading', { level: 1, name: 'Body Map' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('reads the check-in mode from the query string', () => {
    renderAt('/check-in?system=eyes')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Check: Eyes & brain (SANS)' }),
    ).toBeInTheDocument()
  })

  it('sends unknown addresses back to the Body Map', async () => {
    const router = renderAt('/does-not-exist')
    expect(await screen.findByRole('heading', { level: 1, name: 'Body Map' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })
})
