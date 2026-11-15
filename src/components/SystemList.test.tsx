import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { describe, expect, it, vi } from 'vitest'
import { DEMO_CREW } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import { computeHealth } from '../lib/health'
import { generateDemoData } from '../lib/seed'
import { TREND_ARROWS } from '../lib/trends'
import { routes } from '../routes'
import { createAppStore } from '../state/appStore'
import { AppStoreContext } from '../state/useAppStore'
import SystemList from './SystemList'

const TODAY = new Date(2026, 10, 15, 9, 0)
const health = computeHealth(generateDemoData(DEMO_CREW[0], 'mars', TODAY), MISSIONS.mars, TODAY)

function renderList(props: Partial<Parameters<typeof SystemList>[0]> = {}) {
  const router = createMemoryRouter([
    { path: '/', element: <SystemList health={health} {...props} /> },
    { path: '/system/:id', element: <p>detail</p> },
  ])
  render(<RouterProvider router={router} />)
  return router
}

describe('SystemList', () => {
  it('has one link per system, in system order, with status, value and trend in its name', () => {
    renderList()
    const nav = screen.getByRole('navigation', { name: 'Body systems' })
    const links = within(nav).getAllByRole('link')
    expect(links).toHaveLength(8)
    expect(links[0]).toHaveAccessibleName(/^Heart & circulation: OK, \d+\/\d+ mmHg, /)
    expect(
      within(nav).getByRole('link', { name: /^Eyes & brain \(SANS\): Act, 8 lines/ }),
    ).toHaveAttribute('href', '/system/eyes')
    // Not recorded: no value and no trend
    expect(
      within(nav).getByRole('link', { name: 'Balance & orientation: Not recorded' }),
    ).toBeInTheDocument()
  })

  it('shows the trend arrow for recorded systems', () => {
    renderList()
    const heart = screen.getByRole('link', { name: /^Heart/ })
    expect(heart).toHaveTextContent(TREND_ARROWS[health.systems.heart.trend])
  })

  it('opens a system when a row is chosen', async () => {
    const router = renderList()
    await userEvent.setup().click(screen.getByRole('link', { name: /^Immune system/ }))
    expect(router.state.location.pathname).toBe('/system/immune')
  })

  it('reports hover and focus, and shows the highlighted row', () => {
    const onHighlight = vi.fn()
    renderList({ highlighted: 'heart', onHighlight })
    const heart = screen.getByRole('link', { name: /^Heart/ })
    expect(heart.className).toContain('bg-space-800')

    const eyes = screen.getByRole('link', { name: /^Eyes/ })
    fireEvent.mouseEnter(eyes)
    expect(onHighlight).toHaveBeenLastCalledWith('eyes')
    fireEvent.mouseLeave(eyes)
    expect(onHighlight).toHaveBeenLastCalledWith(undefined)
    fireEvent.focus(eyes)
    expect(onHighlight).toHaveBeenLastCalledWith('eyes')
  })
})

describe('Body Map page: figure and list are linked', () => {
  function renderHome() {
    const store = createAppStore({ storage: null, today: TODAY })
    render(
      <AppStoreContext value={store}>
        <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />
      </AppStoreContext>,
    )
  }

  it('highlights the pin when its row is hovered, and the row when its pin is hovered', () => {
    renderHome()
    const row = screen.getByRole('link', { name: /^Immune system: .*(steady|rising|falling)/ })
    const pinGroup = (id: string) =>
      document.querySelector(`svg [data-system="${id}"]`) as SVGGElement

    fireEvent.mouseEnter(row)
    expect(pinGroup('immune').style.opacity).toBe('1')
    expect(pinGroup('heart').style.opacity).toBe('0.4')
    fireEvent.mouseLeave(row)
    expect(pinGroup('heart').style.opacity).toBe('1')

    fireEvent.mouseEnter(pinGroup('heart'))
    expect(
      screen.getByRole('link', { name: /^Heart & circulation: .*(steady|rising|falling)/ })
        .className,
    ).toContain('bg-space-800')
  })
})
