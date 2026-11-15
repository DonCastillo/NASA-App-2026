import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DEMO_CREW } from '../../data/demoCrew'
import { MISSIONS } from '../../data/missions'
import { computeHealth } from '../../lib/health'
import { generateDemoData } from '../../lib/seed'
import BodyFigure from './BodyFigure'

const TODAY = new Date(2026, 10, 15, 9, 0)
// Cmdr. Vega on Mars: Eyes & brain red (SANS storyline)
const health = computeHealth(generateDemoData(DEMO_CREW[0], 'mars', TODAY), MISSIONS.mars, TODAY)

const pin = (name: RegExp) => screen.getByRole('link', { name })

describe('BodyFigure', () => {
  it('draws 8 pins, each with its status word and current reading in the accessible name', () => {
    render(<BodyFigure health={health} onOpen={() => {}} />)
    expect(screen.getAllByRole('link')).toHaveLength(8)
    expect(pin(/^Eyes & brain \(SANS\): Act, 8 lines$/)).toBeInTheDocument()
    expect(pin(/^Radiation exposure: Watch, \d+% budget$/)).toBeInTheDocument()
    expect(pin(/^Balance & orientation: Not recorded$/)).toBeInTheDocument() // grey, never red
  })

  it('pulses only red pins', () => {
    const { container } = render(<BodyFigure health={health} onOpen={() => {}} />)
    const pulsing = [...container.querySelectorAll('.pin-pulse')].map((el) =>
      el.closest('[data-system]')?.getAttribute('data-system'),
    )
    const red = Object.values(health.systems)
      .filter((s) => s.status === 'red')
      .map((s) => s.id)
    expect(pulsing).toEqual(red)
  })

  it('lights amber and red organs, and leaves green ones faint', () => {
    const { container } = render(<BodyFigure health={health} onOpen={() => {}} />)
    const organ = (id: string) => container.querySelector(`[data-organ="${id}"]`)!
    expect(organ('eyes').getAttribute('opacity')).toBe('0.95') // red
    expect(organ('heart').getAttribute('opacity')).toBe('0.35') // green
  })

  it('opens a system on click, Enter or Space', async () => {
    const onOpen = vi.fn()
    const user = userEvent.setup()
    render(<BodyFigure health={health} onOpen={onOpen} />)
    await user.click(pin(/^Immune system/))
    pin(/^Heart & circulation/).focus()
    await user.keyboard('{Enter}')
    pin(/^Mind & sleep/).focus()
    await user.keyboard(' ')
    expect(onOpen.mock.calls.map(([id]) => id)).toEqual(['immune', 'heart', 'mind'])
  })

  it('moves through the pins with Tab', async () => {
    const user = userEvent.setup()
    render(<BodyFigure health={health} onOpen={() => {}} />)
    await user.tab()
    expect(pin(/^Heart & circulation/)).toHaveFocus() // first system in order
    await user.tab()
    expect(pin(/^Eyes & brain/)).toHaveFocus()
  })

  it('shows a tooltip with system, status and reason on hover or focus', async () => {
    const user = userEvent.setup()
    render(<BodyFigure health={health} onOpen={() => {}} />)
    await user.hover(pin(/^Eyes & brain/))
    const tooltip = screen.getByRole('tooltip')
    expect(tooltip).toHaveTextContent('Eyes & brain (SANS)')
    expect(tooltip).toHaveTextContent('✖ Act')
    expect(tooltip).toHaveTextContent(health.systems.eyes.reason)
    expect(pin(/^Eyes & brain/)).toHaveAttribute('aria-describedby', tooltip.id)
    await user.unhover(pin(/^Eyes & brain/))
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('highlights a system from outside and reports hovers', () => {
    const onHighlight = vi.fn()
    const { container, rerender } = render(
      <BodyFigure
        health={health}
        onOpen={() => {}}
        highlighted="heart"
        onHighlight={onHighlight}
      />,
    )
    const pinGroup = (id: string) => container.querySelector(`[data-system="${id}"]`) as SVGGElement
    expect(pinGroup('heart').style.opacity).toBe('1')
    expect(pinGroup('eyes').style.opacity).toBe('0.4') // others dim

    fireEvent.mouseEnter(pinGroup('immune'))
    expect(onHighlight).toHaveBeenLastCalledWith('immune')
    fireEvent.mouseLeave(pinGroup('immune'))
    expect(onHighlight).toHaveBeenLastCalledWith(undefined)

    rerender(<BodyFigure health={health} onOpen={() => {}} />)
    expect(pinGroup('eyes').style.opacity).toBe('1')
  })
})
