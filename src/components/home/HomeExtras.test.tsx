import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { DEMO_CREW } from '../../data/demoCrew'
import { MISSIONS } from '../../data/missions'
import { type Health, computeHealth } from '../../lib/health'
import { generateDemoData } from '../../lib/seed'
import { routes } from '../../routes'
import { createAppStore } from '../../state/appStore'
import { AppStoreContext } from '../../state/useAppStore'
import type { Profile, SystemId } from '../../types'
import AlertsStrip from './AlertsStrip'
import DailyCheckInButton from './DailyCheckInButton'
import ReadinessSummary from './ReadinessSummary'

const TODAY = new Date(2026, 10, 15, 9, 0)
const okafor = computeHealth(generateDemoData(DEMO_CREW[1], 'iss', TODAY), MISSIONS.iss, TODAY)

/** Render inside a router (the components contain links) */
function renderWithRouter(element: React.ReactNode) {
  render(<RouterProvider router={createMemoryRouter([{ path: '*', element }])} />)
}

/** The same health, with every system set to green except the given ones */
function withStatuses(base: Health, statuses: Partial<Record<SystemId, 'amber' | 'red'>>): Health {
  const systems = { ...base.systems }
  const readiness = { green: 0, amber: 0, red: 0, none: 0 }
  for (const id of Object.keys(systems) as SystemId[]) {
    systems[id] = { ...systems[id], status: statuses[id] ?? 'green' }
    readiness[systems[id].status]++
  }
  const ids = Object.keys(statuses) as SystemId[]
  const urgentId = ids.find((id) => statuses[id] === 'red') ?? ids[0]
  return {
    ...base,
    systems,
    readiness,
    mostUrgent: urgentId
      ? { systemId: urgentId, status: statuses[urgentId]!, reason: systems[urgentId].reason }
      : undefined,
  }
}

describe('ReadinessSummary', () => {
  it('counts systems by status, skipping empty groups', () => {
    renderWithRouter(<ReadinessSummary health={okafor} />)
    const list = screen.getByRole('list', { name: 'Systems by status' })
    const text = within(list)
      .getAllByRole('listitem')
      .map((li) => li.textContent)
    const expected = (['green', 'amber', 'red', 'none'] as const)
      .filter((s) => okafor.readiness[s] > 0)
      .map(
        (s) =>
          `${okafor.readiness[s]}${{ green: 'OK', amber: 'Watch', red: 'Act', none: 'Not recorded' }[s]}`,
      )
    expect(text).toEqual(expected)
  })

  it('names the most urgent system when the worst is amber, and leaves red to the alerts', () => {
    const { rerender } = render(
      <RouterProvider
        router={createMemoryRouter([
          {
            path: '*',
            element: <ReadinessSummary health={withStatuses(okafor, { mind: 'amber' })} />,
          },
        ])}
      />,
    )
    expect(screen.getByText(/Most urgent:/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mind & sleep' })).toHaveAttribute(
      'href',
      '/system/mind',
    )
    rerender(
      <RouterProvider
        router={createMemoryRouter([{ path: '*', element: <ReadinessSummary health={okafor} /> }])}
      />,
    )
    expect(screen.queryByText(/Most urgent:/)).not.toBeInTheDocument()
  })
})

describe('AlertsStrip', () => {
  it('shows each red system with its reason, first action and a link', () => {
    renderWithRouter(<AlertsStrip health={okafor} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Immune system')
    expect(alert).toHaveTextContent(okafor.systems.immune.reason)
    expect(alert).toHaveTextContent('Run the onboard infection protocol.')
    expect(within(alert).getByRole('link', { name: 'See what to do' })).toHaveAttribute(
      'href',
      '/system/immune',
    )
  })

  it('names an active solar particle event', () => {
    const health = withStatuses(okafor, { radiation: 'red' })
    renderWithRouter(
      <AlertsStrip health={{ ...health, latest: { ...health.latest, solarParticleEvent: 2 } }} />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Solar particle event in progress')
    expect(screen.getByRole('alert')).toHaveTextContent('Move to the storm shelter')
  })

  it('shows nothing when no system is red', () => {
    renderWithRouter(<AlertsStrip health={withStatuses(okafor, { mind: 'amber' })} />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('DailyCheckInButton', () => {
  it('invites the daily check-in until it is done, then offers to check in again', () => {
    renderWithRouter(<DailyCheckInButton done={false} />)
    expect(screen.getByRole('link', { name: /Start daily check-in/ })).toHaveAttribute(
      'href',
      '/check-in',
    )
  })

  it('shows "done" with a link to check in again', () => {
    renderWithRouter(<DailyCheckInButton done />)
    expect(screen.getByText('Today’s check-in is done')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Check in again' })).toHaveAttribute(
      'href',
      '/check-in',
    )
  })
})

describe('home page', () => {
  function renderHome(setup?: (store: ReturnType<typeof createAppStore>) => void) {
    const store = createAppStore({ storage: null, today: TODAY })
    setup?.(store)
    render(
      <AppStoreContext value={store}>
        <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />
      </AppStoreContext>,
    )
  }

  it('shows the demo crew’s check-in as done (the seed includes this morning)', () => {
    renderHome()
    expect(screen.getByText('Today’s check-in is done')).toBeInTheDocument()
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0) // Vega: eyes red
  })

  it('invites a new user to start today’s check-in', () => {
    const me: Profile = {
      id: 'me',
      name: 'Me',
      isDemo: false,
      supplements: [],
      baselines: {},
      mission: { profileId: 'iss', startDate: '2026-11-15', lengthDays: 180 },
    }
    renderHome((s) => {
      s.getState().saveProfile(me)
      s.getState().selectProfile('me')
    })
    expect(screen.getByRole('link', { name: /Start daily check-in/ })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument() // nothing recorded, nothing red
  })
})
