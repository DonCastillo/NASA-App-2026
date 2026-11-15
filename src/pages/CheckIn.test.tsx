import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { createAppStore } from '../state/appStore'
import { selectDataset } from '../state/selectors'
import { AppStoreContext } from '../state/useAppStore'
import type { Profile } from '../types'

const NOW = new Date(2026, 10, 15, 13, 0)

const me: Profile = {
  id: 'me',
  name: 'Me',
  isDemo: false,
  supplements: [],
  baselines: {},
  mission: { profileId: 'iss', startDate: '2026-11-10', lengthDays: 180 },
}

function renderCheckIn(path: string, setup?: (store: ReturnType<typeof createAppStore>) => void) {
  const store = createAppStore({ storage: null, today: NOW, now: () => NOW })
  setup?.(store)
  const router = createMemoryRouter(routes, { initialEntries: ['/', path], initialIndex: 1 })
  const view = render(
    <AppStoreContext value={store}>
      <RouterProvider router={router} />
    </AppStoreContext>,
  )
  return { store, router, view, user: userEvent.setup() }
}

const asMe = (store: ReturnType<typeof createAppStore>) => {
  store.getState().saveProfile(me)
  store.getState().selectProfile('me')
}

const progress = () => screen.getByText(/^\d+ of \d+$/).textContent
const question = () => screen.getByRole('heading', { level: 2 }).textContent

describe('check-in page', () => {
  it('asks one question at a time with progress, and finishes with a saved check-in', async () => {
    const { store, user } = renderCheckIn('/check-in?system=mind', asMe)
    expect(
      screen.getByRole('heading', { level: 1, name: 'Check: Mind & sleep' }),
    ).toBeInTheDocument()
    expect(progress()).toBe('1 of 6')
    expect(question()).toBe('How many hours did you sleep?')

    // Numbers need a value before Next (no history to pre-fill from)
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Sleep duration' }), '7.5')
    await user.click(screen.getByRole('button', { name: 'Next' }))

    // One-tap scale: tapping answers and moves on
    expect(question()).toBe('How well did you sleep?')
    await user.click(screen.getByRole('button', { name: /Good/ }))
    expect(question()).toBe('How is your mood today?')
    await user.click(screen.getByRole('button', { name: /Great/ }))

    // Skip saves "not recorded"
    expect(question()).toBe('How stressed do you feel?')
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    await user.click(screen.getByRole('button', { name: /Good/ })) // crew relations

    // Note, then Finish
    expect(question()).toBe('Anything else to note? (optional)')
    await user.type(screen.getByRole('textbox', { name: /Anything else to note/ }), 'All good')
    await user.click(screen.getByRole('button', { name: 'Finish' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Check-in complete' })).toBeInTheDocument()
    const saved = selectDataset(store.getState()).checkIns.at(-1)!
    const value = (id: string) => saved.readings.find((r) => r.indicatorId === id)?.value
    expect(value('sleepHours')).toBe(7.5)
    expect(value('sleepQuality')).toBe(4)
    expect(value('mood')).toBe(5)
    expect(value('stress')).toBeNull() // skipped → not recorded
    expect(saved.note).toBe('All good')
    expect(saved.completedAt).toBe(NOW.toISOString())
    expect(store.getState().stored.drafts).toEqual({}) // draft cleared
  })

  it('adds follow-ups as soon as an answer triggers them', async () => {
    const { user } = renderCheckIn('/check-in?task=recheck-mood', asMe)
    expect(progress()).toBe('1 of 2') // mood + note
    await user.click(screen.getByRole('button', { name: /Low/ }))
    // Mood ≤ 3 → stress and sleep quality, with the reason shown
    expect(progress()).toBe('2 of 4')
    expect(question()).toBe('How stressed do you feel?')
    expect(screen.getByText('Your mood is OK or lower')).toBeInTheDocument()
  })

  it('pre-fills numbers from the last reading, and "Same as yesterday" reuses it', async () => {
    const { user } = renderCheckIn('/check-in') // Cmdr. Vega (demo): history includes this morning
    expect(question()).toBe("What's your blood pressure?")
    expect(screen.getByText(/^earlier today: \d+\/\d+ mmHg$/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled() // pre-filled
    await user.click(screen.getByRole('button', { name: 'Same as yesterday' }))
    expect(question()).toBe("What's your resting heart rate?")
  })

  it('checks unlikely numbers before moving on', async () => {
    const { user } = renderCheckIn('/check-in?task=recheck-bodyTemperature', asMe)
    await user.type(screen.getByRole('textbox', { name: 'Body temperature' }), '45')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(screen.getByRole('alert')).toHaveTextContent(
      '45 °C looks unusual. Please check the reading.',
    )
    expect(question()).toBe("What's your body temperature?") // still here

    await user.click(screen.getByRole('button', { name: 'Check again' }))
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'It’s correct' }))
    expect(question()).not.toBe("What's your body temperature?")
  })

  it('shows how to measure on request', async () => {
    const { user } = renderCheckIn('/check-in?task=recheck-bodyTemperature', asMe)
    const toggle = screen.getByRole('button', { name: 'How do I measure this?' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)
    expect(screen.getByText('Measure at rest, before exercise or a hot drink.')).toBeInTheDocument()
  })

  it('keeps answers in a draft and resumes them later; "Start over" clears it', async () => {
    const { store, user, view } = renderCheckIn('/check-in?system=mind', asMe)
    await user.type(screen.getByRole('textbox', { name: 'Sleep duration' }), '6')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(store.getState().stored.drafts.me).toMatchObject({
      index: 1,
      answers: { sleepHours: 6 },
    })
    view.unmount()

    // Come back later
    const router = createMemoryRouter(routes, { initialEntries: ['/check-in?system=mind'] })
    render(
      <AppStoreContext value={store}>
        <RouterProvider router={router} />
      </AppStoreContext>,
    )
    expect(screen.getByText(/Resumed your unfinished check-in/)).toBeInTheDocument()
    expect(question()).toBe('How well did you sleep?')
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(question()).toBe('How many hours did you sleep?')
    expect(store.getState().stored.drafts).toEqual({})
  })

  it('goes back without losing answers', async () => {
    const { user } = renderCheckIn('/check-in?system=mind', asMe)
    await user.type(screen.getByRole('textbox', { name: 'Sleep duration' }), '8')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByRole('textbox', { name: 'Sleep duration' })).toHaveValue('8.0')
  })

  it('ends with a summary of what changed, what to do and what to recheck', async () => {
    // A clock that moves on 1 min 48 s between starting and finishing
    let clock = NOW.getTime()
    const store = createAppStore({ storage: null, today: NOW, now: () => new Date(clock) })
    asMe(store)
    const router = createMemoryRouter(routes, {
      initialEntries: ['/', '/check-in?task=recheck-bodyTemperature'],
      initialIndex: 1,
    })
    render(
      <AppStoreContext value={store}>
        <RouterProvider router={router} />
      </AppStoreContext>,
    )
    const user = userEvent.setup()
    await user.type(screen.getByRole('textbox', { name: 'Body temperature' }), '38.4')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    // 38.4 °C opens the immune checklist and the fever medicine question
    await user.click(screen.getByRole('button', { name: 'Cold sore' }))
    await user.click(screen.getByRole('button', { name: 'Next' }))
    await user.click(screen.getByRole('button', { name: 'No' }))
    clock += 108_000
    await user.click(screen.getByRole('button', { name: 'Finish' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Check-in complete' })).toBeInTheDocument()
    expect(screen.getByText('1 min 48 s')).toBeInTheDocument()
    const changes = screen.getByRole('heading', { name: 'Changes' }).parentElement!
    expect(changes).toHaveTextContent('Immune system: Not recorded → Act')
    expect(changes).toHaveTextContent('→ Run the onboard infection protocol.')
    expect(screen.getByRole('link', { name: 'See what to do' })).toHaveAttribute(
      'href',
      '/system/immune',
    )
    expect(changes).toHaveTextContent('All other systems unchanged (7)')
    expect(screen.getByText('Recheck body temperature in 4–6 h')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Back to Body Map' }))
    expect(router.state.location.pathname).toBe('/')
  })
})
