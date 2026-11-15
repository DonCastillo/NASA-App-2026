import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it } from 'vitest'
import { routes } from '../routes'
import { createAppStore } from '../state/appStore'
import { AppStoreContext } from '../state/useAppStore'

const TODAY = new Date(2026, 10, 15, 9, 0)

function renderApp(entries: string[], index = entries.length - 1) {
  const store = createAppStore({ storage: null, today: TODAY })
  const router = createMemoryRouter(routes, { initialEntries: entries, initialIndex: index })
  render(
    <AppStoreContext value={store}>
      <RouterProvider router={router} />
    </AppStoreContext>,
  )
  return { router, user: userEvent.setup() }
}

describe('System detail panel', () => {
  it('opens from the Body Map with focus inside, and ✕ goes back', async () => {
    const { router, user } = renderApp(['/'])
    await user.click(
      screen.getByRole('link', { name: /^Heart & circulation: .*(steady|rising|falling)/ }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Heart & circulation' })
    expect(dialog).toHaveFocus()
    expect(router.state.location.pathname).toBe('/system/heart')

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(router.state.location.pathname).toBe('/')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes with Esc', async () => {
    const { router, user } = renderApp(['/', '/system/eyes'])
    await user.keyboard('{Escape}')
    expect(router.state.location.pathname).toBe('/')
  })

  it('closes with the browser Back button', async () => {
    const { router } = renderApp(['/', '/system/mind'])
    // Calling the router directly (not via a user action) needs act() so React re-renders
    await act(() => router.navigate(-1))
    expect(router.state.location.pathname).toBe('/')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('goes to the Body Map (not out of the app) when opened directly, e.g. after a refresh', async () => {
    const { router, user } = renderApp(['/system/bones'])
    expect(screen.getByRole('dialog', { name: 'Bones & muscles' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.historyAction).toBe('REPLACE')
  })

  it('stops the page behind from scrolling while open', async () => {
    const { user } = renderApp(['/', '/system/heart'])
    expect(document.body.style.overflow).toBe('hidden')
    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(document.body.style.overflow).toBe('')
  })
})

describe('System detail: status and guidance', () => {
  function renderDetail(path: string, setup?: (store: ReturnType<typeof createAppStore>) => void) {
    const store = createAppStore({ storage: null, today: TODAY })
    setup?.(store)
    render(
      <AppStoreContext value={store}>
        <RouterProvider
          router={createMemoryRouter(routes, { initialEntries: ['/', path], initialIndex: 1 })}
        />
      </AppStoreContext>,
    )
    return screen.getByRole('dialog')
  }
  /** The panel header, where the status chip sits */
  const header = (dialog: HTMLElement) => dialog.querySelector('header') as HTMLElement

  it('shows the status chip, the reason in plain words, actions and the Mars escalation', () => {
    const dialog = renderDetail('/system/eyes') // Cmdr. Vega on Mars, day 150 of 210
    expect(within(header(dialog)).getByText('Act')).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Near-vision self-check: 2 lines worse than baseline')
    expect(dialog).toHaveTextContent(
      'Request an eye exam (onboard ultrasound or imaging) and escalate.',
    )
    expect(dialog).toHaveTextContent('Mars transit · 14 min delay:')
    expect(dialog).toHaveTextContent('Start the onboard protocol first; the CMO leads care.')
  })

  it('words escalation for the ISS differently', () => {
    const dialog = renderDetail('/system/immune', (s) => {
      s.getState().selectProfile('demo-okafor')
      s.getState().selectMission('iss')
    })
    expect(dialog).toHaveTextContent('Run the onboard infection protocol.')
    expect(dialog).toHaveTextContent('ISS · under 1 s delay:')
    expect(dialog).toHaveTextContent('Call the flight surgeons now.')
  })

  it('keeps green calm: "Keep your routine" plus one tip, no escalation', () => {
    const dialog = renderDetail('/system/heart')
    expect(within(header(dialog)).getByText('OK')).toBeInTheDocument()
    expect(dialog).toHaveTextContent('All recorded indicators are in range.')
    expect(dialog).toHaveTextContent('Keep your routine.')
    expect(dialog).toHaveTextContent('Tip: Keep exercising and eating the planned diet.')
    expect(dialog).not.toHaveTextContent('delay:')
    expect(dialog).toHaveTextContent(
      'Before landing: fluid loading and lower-body compression garments.',
    )
  })

  it('offers to check a system that has nothing recorded', () => {
    const dialog = renderDetail('/system/balance')
    expect(within(header(dialog)).getByText('Not recorded')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Check it now' })).toHaveAttribute(
      'href',
      '/check-in?system=balance',
    )
  })

  it('ends with a button to check this system now', () => {
    const dialog = renderDetail('/system/mind')
    expect(within(dialog).getByRole('link', { name: 'Check this system now' })).toHaveAttribute(
      'href',
      '/check-in?system=mind',
    )
  })
})
