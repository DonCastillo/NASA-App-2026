import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEMO_CREW } from '../../data/demoCrew'
import { MISSIONS } from '../../data/missions'
import { SYSTEMS } from '../../data/systems'
import { computeHealth } from '../../lib/health'
import { generateDemoData } from '../../lib/seed'
import type { CheckIn, Profile, SystemId } from '../../types'
import IndicatorCards from './IndicatorCards'

const TODAY = new Date(2026, 10, 15, 9, 0)
const vega = computeHealth(generateDemoData(DEMO_CREW[0], 'mars', TODAY), MISSIONS.mars, TODAY)
const system = (id: SystemId) => SYSTEMS.find((s) => s.id === id)!

const cards = () =>
  within(screen.getByRole('region', { name: 'Indicators' }))
    .getAllByRole('listitem')
    .map((li) => li.getAttribute('data-indicator'))

describe('IndicatorCards', () => {
  it('puts red and amber first, keeping the system order within each group', () => {
    render(<IndicatorCards system={system('eyes')} health={vega} today={TODAY} />)
    const order = cards()
    const statusOf = (id: string | null) =>
      vega.systems.eyes.indicators.find((r) => r.indicatorId === id)?.status
    const rank = { red: 0, amber: 1, green: 2, none: 3 }
    const ranks = order.map((id) => rank[statusOf(id) ?? 'none'])
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b))
    expect(order[0]).toBe('nearVision') // red, first in the system
  })

  it('shows value, status, change vs baseline, time, and why a rule raised it', () => {
    render(<IndicatorCards system={system('eyes')} health={vega} today={TODAY} />)
    const nearVision = screen.getByText('Near-vision self-check').closest('li')!
    expect(nearVision).toHaveTextContent('8 lines')
    expect(nearVision).toHaveTextContent('2 lines worse than baseline')
    expect(nearVision).toHaveTextContent(/Act · today \d\d:\d\d/)

    const headache = screen.getByText('Headache').closest('li')!
    expect(headache).toHaveTextContent('Headache with a vision change')
  })

  it('compares absolute readings with the setup baseline', () => {
    render(<IndicatorCards system={system('heart')} health={vega} today={TODAY} />)
    const bp = screen.getByText('Blood pressure').closest('li')!
    expect(bp).toHaveTextContent(/[+−±]\d+\/[+−±]\d+ mmHg vs baseline/)
  })

  it('shows follow-ups that were not triggered as "Not asked recently", without a value', () => {
    render(<IndicatorCards system={system('heart')} health={vega} today={TODAY} />)
    const swelling = screen.getByText('Neck or arm swelling / pain').closest('li')!
    expect(swelling).toHaveTextContent('Not asked recently')
    expect(within(swelling).getByLabelText('No value')).toHaveTextContent('–')
    // Recorded items come before not-recorded ones
    expect(cards().slice(-2)).toEqual(expect.arrayContaining(['neckArmSwelling']))
  })

  it('mentions when a stale indicator was last recorded', () => {
    const at = (day: number) => new Date(2026, 10, day, 8).toISOString()
    const profile: Profile = {
      id: 'me',
      name: 'Me',
      isDemo: false,
      supplements: [],
      baselines: {},
      mission: { profileId: 'iss', startDate: '2026-10-01', lengthDays: 180 },
    }
    const checkIns: CheckIn[] = [
      {
        id: 'old',
        profileId: 'me',
        mode: { kind: 'daily' },
        startedAt: at(5),
        readings: [{ indicatorId: 'headache', value: 2, recordedAt: at(5) }], // 10 days ago
        countermeasures: [],
      },
    ]
    const health = computeHealth({ profile, checkIns, events: [] }, MISSIONS.iss, TODAY)
    render(<IndicatorCards system={system('eyes')} health={health} today={TODAY} />)
    const headache = screen.getByText('Headache').closest('li')!
    // Headache is a follow-up: "Not asked recently", plus when it was last recorded
    expect(headache).toHaveTextContent('Not asked recently · last recorded 10 days ago')
  })
})
