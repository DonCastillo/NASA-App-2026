import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { createAppStore } from '../state/appStore'
import { ONBOARDED } from '../test/onboarded'
import { selectDataset } from '../state/selectors'
import { AppStoreContext } from '../state/useAppStore'

const NOW = new Date(2026, 10, 15, 9, 0)

function renderHome(missionId: 'iss' | 'artemis' = 'artemis') {
  const store = createAppStore({ storage: null, settings: ONBOARDED, today: NOW, now: () => NOW })
  store.getState().selectMission(missionId)
  render(
    <AppStoreContext value={store}>
      <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />
    </AppStoreContext>,
  )
  return { store, user: userEvent.setup() }
}

const latestEvent = (store: ReturnType<typeof createAppStore>) =>
  store.getState().stored.events.at(-1)

describe('Log event overlay', () => {
  it('opens from the header, logs a landing now, and says what the next check-in will ask', async () => {
    const { store, user } = renderHome()
    const button = screen.getByRole('button', { name: 'Log event' })
    await user.click(button)
    expect(screen.getByRole('dialog', { name: 'What happened?' })).toHaveFocus()

    await user.click(screen.getByRole('radio', { name: /Landing \/ docking/ }))
    await user.type(screen.getByRole('textbox', { name: 'Note (optional)' }), 'Shackleton rim')
    // The form's own "Log event" button (the header has one too)
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Log event' }))

    const dialog = screen.getByRole('dialog', { name: 'Landing / docking logged' })
    expect(dialog).toHaveTextContent(
      'Your next check-in will ask about motion sickness, dizziness / disorientation, balance self-test.',
    )
    expect(latestEvent(store)).toMatchObject({
      type: 'landing',
      note: 'Shackleton rim',
      missionId: 'artemis',
      profileId: 'demo-vega',
      at: NOW.toISOString(),
    })
    // The event is part of the crew member's data (events feed the check-in engine and charts)
    expect(selectDataset(store.getState()).events.some((e) => e.note === 'Shackleton rim')).toBe(
      true,
    )

    await user.click(screen.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(button).toHaveFocus()
  })

  it('logs an upcoming landing and mentions the pre-landing questions', async () => {
    const { store, user } = renderHome()
    await user.click(screen.getByRole('button', { name: 'Log event' }))
    await user.click(screen.getByRole('radio', { name: /Landing \/ docking/ }))
    const when = screen.getByLabelText('When')
    await user.clear(when)
    await user.type(when, '2026-11-15T20:00')
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Log event' }))
    expect(screen.getByRole('dialog')).toHaveTextContent(
      'Before it, your check-in will ask: Have you completed fluid loading? Are you wearing compression garments?',
    )
    expect(new Date(latestEvent(store)!.at) > NOW).toBe(true)
  })

  it('closes with Esc without logging anything', async () => {
    const { store, user } = renderHome()
    await user.click(screen.getByRole('button', { name: 'Log event' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(store.getState().stored.events).toEqual([])
  })
})
