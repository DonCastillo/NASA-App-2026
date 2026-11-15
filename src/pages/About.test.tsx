import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { createAppStore } from '../state/appStore'
import { AppStoreContext } from '../state/useAppStore'
import { ONBOARDED } from '../test/onboarded'

const NOW = new Date(2026, 10, 15, 9, 0)

function renderAbout() {
  const store = createAppStore({ storage: null, today: NOW, now: () => NOW, settings: ONBOARDED })
  const router = createMemoryRouter(routes, { initialEntries: ['/about'] })
  render(
    <AppStoreContext value={store}>
      <RouterProvider router={router} />
    </AppStoreContext>,
  )
  return { store, router, user: userEvent.setup() }
}

describe('About', () => {
  it('explains statuses, check-ins, comms delay, indicators, sources and the disclaimer', () => {
    renderAbout()
    expect(screen.getByRole('heading', { level: 1, name: 'About' })).toBeInTheDocument()
    for (const word of ['OK', 'Watch', 'Act', 'Not recorded']) {
      expect(screen.getAllByText(word).length).toBeGreaterThan(0)
    }
    const delays = screen.getByRole('table')
    expect(within(delays).getByRole('rowheader', { name: 'Mars transit' })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: '8 body systems, 28 indicators' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/18 direct · 9 proxy · 1 added/)).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Risk of Cardiovascular Adaptations/ }),
    ).toHaveAttribute('href', 'https://www.nasa.gov/reference/risk-of-cardiovascular-adaptations/')
    expect(screen.getByRole('region', { name: 'Disclaimer' })).toHaveTextContent(
      /not medical advice/,
    )
  })

  it('replays the tour on the Body Map', async () => {
    const { store, router, user } = renderAbout()
    await user.click(screen.getByRole('button', { name: 'Take the tour again' }))
    expect(router.state.location.pathname).toBe('/')
    expect(store.getState().stored.settings.tourSeen).toBe(false)
    expect(await screen.findByRole('dialog', { name: 'Body systems' })).toBeInTheDocument()
  })

  it('resets demo data after a confirmation', async () => {
    const { store, user } = renderAbout()
    const at = NOW.toISOString()
    store.getState().addCheckIn({
      id: 'x',
      profileId: 'demo-vega',
      mode: { kind: 'daily' },
      startedAt: at,
      completedAt: at,
      readings: [],
      countermeasures: [],
    })
    await user.click(screen.getByRole('button', { name: 'Reset demo data…' }))
    await user.click(screen.getByRole('button', { name: 'Reset demo data' }))
    expect(store.getState().stored.checkIns).toEqual([])
    expect(screen.getByRole('status')).toHaveTextContent('Demo data reset.')
  })
})
