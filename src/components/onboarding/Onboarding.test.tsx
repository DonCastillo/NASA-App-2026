import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { HINTS } from '../../data/onboarding'
import { routes } from '../../routes'
import { createAppStore } from '../../state/appStore'
import { AppStoreContext } from '../../state/useAppStore'

const NOW = new Date(2026, 10, 15, 9, 0)

/** A first visit: nothing seen yet */
function renderApp(
  path = '/',
  store = createAppStore({ storage: null, today: NOW, now: () => NOW }),
) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const view = render(
    <AppStoreContext value={store}>
      <RouterProvider router={router} />
    </AppStoreContext>,
  )
  return { store, router, view, user: userEvent.setup() }
}

describe('first visit', () => {
  it('shows the Welcome, then a 6-step tour that Enter moves through and Esc skips', async () => {
    const { store, user } = renderApp()
    const welcome = screen.getByRole('dialog', { name: 'Crew health at a glance' })
    expect(within(welcome).getAllByRole('heading', { level: 3 })).toHaveLength(3)

    await user.click(within(welcome).getByRole('button', { name: 'Explore demo crew' }))
    expect(store.getState().stored.settings.welcomeSeen).toBe(true)
    const tour = await screen.findByRole('dialog', { name: 'Body systems' })
    expect(tour).toHaveAccessibleDescription(
      'Each pin is a body system. The color shows its status: green, amber or red.',
    )
    expect(within(tour).getByText('1 of 6')).toBeInTheDocument()
    expect(within(tour).getByRole('button', { name: 'Next' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(screen.getByRole('dialog', { name: 'One system' })).toHaveTextContent('2 of 6')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(store.getState().stored.settings.tourSeen).toBe(true)
  })

  it('ends the tour with Done on the last step', async () => {
    const { store, user } = renderApp()
    await user.click(screen.getByRole('button', { name: 'Explore demo crew' }))
    for (let i = 0; i < 5; i++) await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('dialog', { name: 'Mission' })).toHaveTextContent('6 of 6')
    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(store.getState().stored.settings.tourSeen).toBe(true)
  })

  it('"Set up my profile" opens setup and skips the tour', async () => {
    const { store, router, user } = renderApp()
    await user.click(screen.getByRole('button', { name: 'Set up my profile' }))
    expect(router.state.location.pathname).toBe('/setup')
    expect(router.state.location.search).toBe('?new=1')
    expect(store.getState().stored.settings).toMatchObject({ welcomeSeen: true, tourSeen: true })
  })

  it('keeps Tab inside the Welcome', async () => {
    const { user } = renderApp()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Set up my profile' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus()
  })

  it('waits for the Body Map: no Welcome on other pages', () => {
    renderApp('/about')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('first-time hints', () => {
  it('shows the check-in hint once', () => {
    const store = createAppStore({ storage: null, today: NOW, now: () => NOW })
    const first = renderApp('/check-in', store)
    expect(screen.getByRole('note')).toHaveTextContent(HINTS.checkIn)
    first.view.unmount()
    renderApp('/check-in', store)
    expect(screen.queryByText(HINTS.checkIn)).not.toBeInTheDocument()
  })

  it('shows the System detail hint, and it can be dismissed', async () => {
    const store = createAppStore({
      storage: null,
      today: NOW,
      now: () => NOW,
      settings: { welcomeSeen: true, tourSeen: true },
    })
    const { user } = renderApp('/system/heart', store)
    expect(screen.getByRole('note')).toHaveTextContent(HINTS.systemDetail)
    await user.click(screen.getByRole('button', { name: 'Dismiss hint' }))
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
