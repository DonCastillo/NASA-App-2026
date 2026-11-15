import { describe, expect, it } from 'vitest'
import { highlightBox, tooltipPlacement } from './tour'

const desktop = { width: 1280, height: 800 }
const phone = { width: 375, height: 700 }

describe('highlightBox', () => {
  it('pads the target', () => {
    expect(highlightBox({ top: 10, left: 20, width: 40, height: 40 })).toEqual({
      top: 4,
      left: 14,
      width: 52,
      height: 52,
    })
  })
})

describe('tooltipPlacement', () => {
  it('goes below a target near the top, centered under it', () => {
    const bell = { top: 10, left: 1000, width: 40, height: 40 }
    expect(tooltipPlacement(bell, desktop)).toEqual({
      placement: 'below',
      width: 320,
      left: 860,
      top: 62,
    })
  })

  it('goes above a target near the bottom', () => {
    const button = { top: 700, left: 100, width: 300, height: 44 }
    expect(tooltipPlacement(button, desktop)).toMatchObject({ placement: 'above', bottom: 112 })
  })

  it('stays inside the window on phones', () => {
    const edge = { top: 10, left: 330, width: 40, height: 40 }
    const placed = tooltipPlacement(edge, phone)
    expect(placed.width).toBe(320)
    expect(placed.left).toBe(375 - 320 - 16)
  })

  it('sits over the bottom of a target taller than the window', () => {
    const figure = { top: 20, left: 0, width: 600, height: 760 }
    expect(tooltipPlacement(figure, desktop)).toMatchObject({ placement: 'inside', bottom: 16 })
  })

  it('is centered when the target is missing', () => {
    expect(tooltipPlacement(undefined, desktop)).toMatchObject({ placement: 'center', left: 480 })
  })
})
