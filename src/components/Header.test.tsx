import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { createAppStore } from '../state/appStore'
import { AppStoreContext } from '../state/useAppStore'
import type { Profile } from '../types'

const TODAY = new Date(2026, 10, 15, 9, 0)

/** Render the app at a path with a fresh store (no storage, fixed date) */
function renderApp(path = '/', setup?: (store: ReturnType<typeof createAppStore>) => void) {
  const store = createAppStore({ storage: null, today: TODAY })
  setup?.(store)
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  render(
    <AppStoreContext value={store}>
      <RouterProvider router={router} />
    </AppStoreContext>,
  )
  return { store, router, user: userEvent.setup() }
}

const me: Profile = {
  id: 'user-1',
  name: 'Don',
  isDemo: false,
  supplements: [],
  baselines: {},
  mission: { profileId: 'iss', startDate: '2026-11-01', lengthDays: 180 },
}

describe('header', () => {
  it('shows the selected crew member, mission, mission day and comms delay', () => {
    renderApp()
    const header = screen.getByRole('banner')
    expect(
      within(header).getByRole('button', { name: 'Crew member: Cmdr. Vega' }),
    ).toBeInTheDocument()
    expect(
      within(header).getAllByRole('button', { name: 'Mission: Mars transit' })[0],
    ).toBeInTheDocument()
    // Mars day 150 of 210: delay ≈ 150/210 × 20 min ≈ 14 min
    expect(within(header).getAllByText('Day 150/210')[0]).toBeInTheDocument()
    expect(within(header).getAllByText('14 min')[0]).toBeInTheDocument()
    expect(
      within(header).getAllByRole('progressbar', { name: 'Mission progress' })[0],
    ).toHaveAttribute('aria-valuenow', '150')
  })

  it('has the bell and Log event placeholders', () => {
    renderApp()
    expect(screen.getByRole('button', { name: /Notifications/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Log event/ })).toBeDisabled()
  })
})

describe('Crew ▾', () => {
  it('lists demo crew and the user’s profiles, and switches whose data is shown', async () => {
    const { store, user } = renderApp('/', (s) => s.getState().saveProfile(me))
    await user.click(screen.getByRole('button', { name: /Crew member/ }))
    const menu = screen.getByRole('menu')
    const options = within(menu).getAllByRole('menuitemradio')
    // The ✓ on the selected item is decorative (aria-hidden), so drop it when comparing names
    expect(options.map((o) => o.textContent?.replace('✓', ''))).toEqual([
      'Don',
      'Cmdr. Vega',
      'Dr. Okafor',
      'Eng. Lindqvist',
    ])
    expect(within(menu).getByRole('menuitemradio', { name: /Cmdr. Vega/ })).toHaveAttribute(
      'aria-checked',
      'true',
    )

    await user.click(within(menu).getByRole('menuitemradio', { name: /Dr. Okafor/ }))
    expect(store.getState().selectedProfileId).toBe('demo-okafor')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Crew member: Dr. Okafor' })).toHaveFocus()
  })

  it('opens setup to add a crew member', async () => {
    const { router, user } = renderApp()
    await user.click(screen.getByRole('button', { name: /Crew member/ }))
    expect(screen.queryByRole('menuitem', { name: 'Edit profile' })).not.toBeInTheDocument() // demo crew
    await user.click(screen.getByRole('menuitem', { name: '+ Add crew member' }))
    expect(router.state.location.pathname).toBe('/setup')
    expect(router.state.location.search).toBe('?new=1')
  })

  it('offers "Edit profile" for the user’s own profile', async () => {
    const { router, user } = renderApp('/', (s) => {
      s.getState().saveProfile(me)
      s.getState().selectProfile(me.id)
    })
    await user.click(screen.getByRole('button', { name: /Crew member/ }))
    await user.click(screen.getByRole('menuitem', { name: 'Edit profile' }))
    expect(router.state.location.pathname).toBe('/setup')
    expect(router.state.location.search).toBe('')
  })

  it('closes on Esc and on a click outside', async () => {
    const { user } = renderApp()
    const button = screen.getByRole('button', { name: /Crew member/ })
    await user.click(button)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(button).toHaveFocus()

    await user.click(button)
    await user.click(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('Mission ▾', () => {
  it('shows what each mission’s length covers and switches the mission', async () => {
    const { store, user } = renderApp()
    await user.click(screen.getAllByRole('button', { name: 'Mission: Mars transit' })[0])
    const menu = screen.getByRole('menu')
    expect(within(menu).getByText('One way: Earth → Mars · 210 days')).toBeInTheDocument()
    expect(within(menu).getByText('Stay on the station · 180 days')).toBeInTheDocument()

    await user.click(within(menu).getByRole('menuitemradio', { name: /ISS/ }))
    expect(store.getState().selectedMissionId).toBe('iss')
    expect(screen.getAllByText('Day 120/180')[0]).toBeInTheDocument()
    expect(screen.getAllByText('under 1 s')[0]).toBeInTheDocument()
  })
})
