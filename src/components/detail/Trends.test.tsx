import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { DEMO_CREW } from '../../data/demoCrew'
import { MISSIONS } from '../../data/missions'
import { SYSTEMS } from '../../data/systems'
import { computeHealth } from '../../lib/health'
import { generateDemoData } from '../../lib/seed'
import type { SystemId } from '../../types'
import Trends from './Trends'

const TODAY = new Date(2026, 10, 15, 9, 0)
const dataset = generateDemoData(DEMO_CREW[0], 'mars', TODAY) // Vega, Mars day 150
const health = computeHealth(dataset, MISSIONS.mars, TODAY)
const system = (id: SystemId) => SYSTEMS.find((s) => s.id === id)!

const renderTrends = (id: SystemId) =>
  render(<Trends system={system(id)} health={health} dataset={dataset} today={TODAY} />)

describe('Trends', () => {
  it('draws a chart for each number indicator with data, summarised for screen readers', () => {
    renderTrends('bones')
    const section = screen.getByRole('region', { name: 'Trends' })
    const figures = within(section).getAllByRole('figure')
    expect(figures.map((f) => f.getAttribute('aria-label')?.split(',')[0])).toEqual([
      'Exercise completed',
      'Fitness self-test (strength)',
      'Estimated bone loss',
    ])
    expect(figures[0]).toHaveAttribute('aria-label', expect.stringMatching(/day 121 to 150/))
  })

  it('shows scales as a status timeline', () => {
    renderTrends('eyes')
    expect(screen.getByRole('figure', { name: /^Headache: \d+ / })).toBeInTheDocument()
  })

  it('switches the range for every chart', async () => {
    const user = userEvent.setup()
    renderTrends('bones')
    expect(screen.getByRole('button', { name: '30 d' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: '7 d' }))
    expect(screen.getByRole('button', { name: '7 d' })).toHaveAttribute('aria-pressed', 'true')
    expect(
      screen.getByRole('figure', { name: /^Exercise completed, day 144 to 150/ }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Mission' }))
    expect(
      screen.getByRole('figure', { name: /^Exercise completed, day 1 to 150/ }),
    ).toBeInTheDocument()
  })

  it('leaves out indicators with nothing recorded, and says so when a system has none', () => {
    renderTrends('balance') // Vega on Mars: no landing, so nothing recorded
    expect(screen.getByText('No readings in this range yet.')).toBeInTheDocument()
  })
})
