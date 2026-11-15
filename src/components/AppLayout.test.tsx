import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { appStore } from '../state/useAppStore'
import { routes } from '../routes'
import Nav from './Nav'

// Skip the first-visit Welcome and tour, which would cover the Body Map
beforeEach(() => appStore.getState().updateSettings({ welcomeSeen: true, tourSeen: true }))

// Nav links may include a due-count badge (e.g. "Routine3" or "3Routine"); compare the labels only
const label = (link: HTMLElement) => link.textContent?.replace(/\d+/g, '')

function renderAt(path: string) {
  render(<RouterProvider router={createMemoryRouter(routes, { initialEntries: [path] })} />)
}

describe('app shell', () => {
  it('has a header with the logo, and a side nav and a bottom nav with the 4 tabs', () => {
    renderAt('/')
    expect(screen.getByRole('banner')).toHaveTextContent('BodyMap')
    const navs = screen.getAllByRole('navigation', { name: 'Main' })
    expect(navs).toHaveLength(2) // side (desktop) + bottom (phone); CSS shows one at a time
    for (const nav of navs) {
      const labels = within(nav).getAllByRole('link').map(label)
      expect(labels).toEqual(['Body Map', 'Check-in', 'Routine', 'About'])
    }
  })

  it('marks the current page’s tab as active in both navs', () => {
    renderAt('/routine')
    const active = screen.getAllByRole('link', { current: 'page' })
    expect(active.map(label)).toEqual(['Routine', 'Routine'])
  })

  it('keeps Body Map active only on the home page', () => {
    renderAt('/system/heart')
    expect(screen.queryAllByRole('link', { current: 'page' })).toHaveLength(0)
  })

  it('does not list Setup in the nav (reached from the Crew menu)', () => {
    renderAt('/setup')
    expect(screen.queryByRole('link', { name: /setup/i })).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Crew & mission setup' }),
    ).toBeInTheDocument()
  })
})

describe('nav badges', () => {
  it('shows a due count on Check-in and Routine when given', () => {
    render(
      <RouterProvider
        router={createMemoryRouter([
          { path: '*', element: <Nav variant="side" badges={{ '/check-in': 1, '/routine': 2 }} /> },
        ])}
      />,
    )
    expect(screen.getByLabelText('1 due')).toBeInTheDocument()
    expect(screen.getByLabelText('2 due')).toBeInTheDocument()
  })

  it('shows no badge for zero', () => {
    render(
      <RouterProvider
        router={createMemoryRouter([
          { path: '*', element: <Nav variant="bottom" badges={{ '/routine': 0 }} /> },
        ])}
      />,
    )
    expect(screen.queryByLabelText(/due/)).not.toBeInTheDocument()
  })
})
