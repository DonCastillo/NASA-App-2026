// Where the guided tour draws its highlight box and tooltip (plan/tasks.md 7.3). Pure: the
// component measures the target element and the window, and passes the numbers in.

export type Rect = { top: number; left: number; width: number; height: number }
export type Viewport = { width: number; height: number }

export const TOOLTIP_MAX_WIDTH = 320
/** Space kept between the tooltip and the window edge, and between it and the target */
const MARGIN = 16
const GAP = 12
/** Roughly the tallest tooltip; below or above the target needs at least this much room */
const TOOLTIP_ROOM = 170

/** The highlight box: the target plus a little padding */
export const highlightBox = (target: Rect, padding = 6): Rect => ({
  top: target.top - padding,
  left: target.left - padding,
  width: target.width + padding * 2,
  height: target.height + padding * 2,
})

export type TooltipPlacement = {
  placement: 'below' | 'above' | 'inside' | 'center'
  left: number
  width: number
  /** Distance from the top of the window (below, center) */
  top?: number
  /** Distance from the bottom of the window (above, inside) */
  bottom?: number
}

/**
 * Below the target if it fits, else above, else over the bottom of a tall target. Without a
 * target (e.g. it isn't on screen), in the middle of the window.
 */
export function tooltipPlacement(target: Rect | undefined, viewport: Viewport): TooltipPlacement {
  const width = Math.min(TOOLTIP_MAX_WIDTH, viewport.width - MARGIN * 2)
  if (!target) {
    return {
      placement: 'center',
      width,
      left: (viewport.width - width) / 2,
      top: Math.max(MARGIN, viewport.height / 2 - TOOLTIP_ROOM / 2),
    }
  }
  const centered = target.left + target.width / 2 - width / 2
  const left = Math.min(Math.max(centered, MARGIN), viewport.width - width - MARGIN)
  const bottomEdge = target.top + target.height
  const spaceBelow = viewport.height - bottomEdge
  if (spaceBelow >= TOOLTIP_ROOM + GAP)
    return { placement: 'below', width, left, top: bottomEdge + GAP }
  if (target.top >= TOOLTIP_ROOM + GAP) {
    return { placement: 'above', width, left, bottom: viewport.height - target.top + GAP }
  }
  return { placement: 'inside', width, left, bottom: MARGIN }
}
