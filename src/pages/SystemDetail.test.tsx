import { act, render, screen } from '@testing-library/react'
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
