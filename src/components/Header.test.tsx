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
function renderApp(
  path = '/',
  setup?: (store: ReturnType<typeof createAppStore>) => void,
  now = TODAY,
) {
  const store = createAppStore({ storage: null, today: now, now: () => now })
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

  it('has a working Log event button', () => {
    renderApp()
    expect(screen.getByRole('button', { name: 'Log event' })).toBeEnabled()
  })
})

describe('🔔 notifications', () => {
  /** Don's own profile, selected; mission day 15 (started 1 Nov) */
  const asMe = (s: ReturnType<typeof createAppStore>) => {
    s.getState().saveProfile(me)
    s.getState().selectProfile(me.id)
  }

  it('counts pending tasks, lists them by priority and opens the tapped task', async () => {
    const { router, user } = renderApp('/', asMe)
    // Daily check-in + near vision (due today) + 5 weekly items missed earlier this week
    const bell = screen.getByRole('button', { name: 'Notifications: 7 tasks to do' })
    expect(bell).toHaveClass('text-warn') // something is overdue
    await user.click(bell)
    const items = within(screen.getByRole('menu')).getAllByRole('menuitem')
    expect(items[0]).toHaveTextContent('Daily check-in')
    expect(items[0]).toHaveTextContent('due')
    expect(items[1]).toHaveTextContent('late')
    expect(items.at(-1)).toHaveTextContent('See full routine →')

    await user.click(items[1])
    expect(router.state.location.pathname).toBe('/check-in')
    expect(router.state.location.search).toMatch(/^\?task=weekly-/)
  })

  it('turns red when a red recheck is pending', async () => {
    renderApp('/', (s) => {
      asMe(s)
      s.getState().addCheckIn({
        id: 'fever',
        profileId: me.id,
        mode: { kind: 'system', systemId: 'immune' },
        startedAt: new Date(2026, 10, 15, 3).toISOString(),
        completedAt: new Date(2026, 10, 15, 3).toISOString(),
        readings: [
          {
            indicatorId: 'bodyTemperature',
            value: 38.6,
            recordedAt: new Date(2026, 10, 15, 3).toISOString(),
          },
        ],
        countermeasures: [],
      })
    })
    expect(screen.getByRole('button', { name: /Notifications: \d+ tasks/ })).toHaveClass(
      'text-alert-text',
    )
  })

  it('shows the empty state when nothing is pending', async () => {
    const fresh = { ...me, mission: { ...me.mission, startDate: '2026-11-15' } } // day 1
    const at = new Date(2026, 10, 15, 8).toISOString()
    const { user } = renderApp('/', (s) => {
      s.getState().saveProfile(fresh)
      s.getState().selectProfile(fresh.id)
      s.getState().addCheckIn({
        id: 'done',
        profileId: fresh.id,
        mode: { kind: 'daily' },
        startedAt: at,
        completedAt: at,
        readings: [{ indicatorId: 'nearVision', value: 10, recordedAt: at }],
        countermeasures: [],
      })
    })
    await user.click(screen.getByRole('button', { name: 'Notifications' }))
    expect(screen.getByRole('menu')).toHaveTextContent(
      '✓ All done for today · next: tomorrow 06:00',
    )
  })
})

describe('Routine page and nav badges', () => {
  it('agree with the bell', () => {
    renderApp('/routine', (s) => {
      s.getState().saveProfile(me)
      s.getState().selectProfile(me.id)
    })
    expect(screen.getByRole('heading', { level: 1, name: 'Routine' })).toBeInTheDocument()
    // Bell 7 · Routine badge 7 · Check-in badge 1 (daily not done)
    expect(screen.getByRole('button', { name: 'Notifications: 7 tasks to do' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('7 due')).toHaveLength(2) // side + bottom nav
    expect(screen.getAllByLabelText('1 due')).toHaveLength(2)

    const today = screen.getByRole('heading', { name: 'Today' }).parentElement!
    const rows = within(today).getAllByRole('link')
    expect(rows[0]).toHaveAttribute('href', expect.stringContaining('task=weekly-'))
    expect(within(today).getByRole('link', { name: /Daily check-in/ })).toHaveAttribute(
      'href',
      '/check-in',
    )
    // Weekly items in the next 6 days, and the week's completion
    expect(screen.getByText('Mon 16 Nov')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Done this week' })).toHaveAttribute(
      'aria-valuemax',
      '13',
    )
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
