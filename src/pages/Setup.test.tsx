import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { createAppStore } from '../state/appStore'
import { selectDataset } from '../state/selectors'
import { AppStoreContext } from '../state/useAppStore'

const NOW = new Date(2026, 10, 15, 9, 0)

function renderAt(path: string, setup?: (store: ReturnType<typeof createAppStore>) => void) {
  const store = createAppStore({ storage: null, today: NOW, now: () => NOW })
  setup?.(store)
  const router = createMemoryRouter(routes, { initialEntries: ['/', path], initialIndex: 1 })
  render(
    <AppStoreContext value={store}>
      <RouterProvider router={router} />
    </AppStoreContext>,
  )
  return { store, router, user: userEvent.setup() }
}

describe('Setup: add a crew member', () => {
  it('goes through 3 skippable steps and creates, selects and opens the new profile', async () => {
    const { store, router, user } = renderAt('/setup?new=1')
    expect(screen.getByRole('heading', { level: 1, name: 'Add crew member' })).toBeInTheDocument()
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Display name or call sign' }), 'Don')
    await user.click(screen.getByRole('checkbox', { name: 'Daily B vitamin' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))

    // Baselines: skip the whole step ("Don't know")
    expect(
      screen.getByRole('heading', { level: 2, name: 'Preflight baselines' }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Skip' }))

    // Mission: Mars pre-fills 210 days and says what the length covers
    await user.click(screen.getByRole('radio', { name: /Mars transit/ }))
    expect(screen.getByRole('textbox', { name: 'Length (days)' })).toHaveValue('210')
    expect(screen.getByText('One way: Earth → Mars · default 210 days')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Finish' }))

    expect(router.state.location.pathname).toBe('/')
    const profile = selectDataset(store.getState()).profile
    expect(profile).toMatchObject({
      name: 'Don',
      isDemo: false,
      supplements: ['bVitamin'],
      baselines: {},
      mission: { profileId: 'mars', startDate: '2026-11-15', lengthDays: 210 },
    })
    expect(store.getState().selectedProfileId).toBe(profile.id)
  })

  it('asks for a name before finishing', async () => {
    const { user } = renderAt('/setup?new=1')
    await user.click(screen.getByRole('button', { name: 'Mission' }))
    await user.click(screen.getByRole('button', { name: 'Finish' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Add a display name or call sign.')
  })
})

describe('Setup: edit and delete', () => {
  const addDon = (store: ReturnType<typeof createAppStore>) => {
    store.getState().saveProfile({
      id: 'don',
      name: 'Don',
      isDemo: false,
      age: 41,
      supplements: [],
      baselines: { restingHeartRate: 58 },
      mission: { profileId: 'iss', startDate: '2026-11-01', lengthDays: 180 },
    })
    store.getState().selectProfile('don')
  }

  it('pre-fills the current profile and saves changes', async () => {
    const { store, user } = renderAt('/setup', addDon)
    expect(screen.getByRole('heading', { level: 1, name: 'Edit Don' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Age' })).toHaveValue('41')
    await user.click(screen.getByRole('button', { name: 'Preflight baselines' }))
    expect(screen.getByRole('textbox', { name: 'Resting heart rate (bpm)' })).toHaveValue('58')
    await user.click(screen.getByRole('button', { name: 'Mission' }))
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(store.getState().stored.profiles[0]).toMatchObject({ id: 'don', age: 41 })
  })

  it('deletes the profile only after confirming', async () => {
    const { store, router, user } = renderAt('/setup', addDon)
    await user.click(screen.getByRole('button', { name: 'Delete profile…' }))
    const confirm = screen.getByRole('alert')
    expect(confirm).toHaveTextContent('This can’t be undone.')
    await user.click(within(confirm).getByRole('button', { name: 'Cancel' }))
    expect(store.getState().stored.profiles).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Delete profile…' }))
    await user.click(screen.getByRole('button', { name: 'Delete profile' }))
    expect(store.getState().stored.profiles).toEqual([])
    expect(router.state.location.pathname).toBe('/')
  })

  it('explains that demo crew can’t be edited and offers to add a crew member', () => {
    renderAt('/setup') // Cmdr. Vega is selected
    expect(screen.getByText(/part of the demo crew/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Add crew member' })).toHaveAttribute(
      'href',
      '/setup?new=1',
    )
  })
})
