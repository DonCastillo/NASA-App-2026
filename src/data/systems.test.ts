import { describe, expect, it } from 'vitest'
import { SYSTEM_IDS, type Band, type Indicator, type ScoredStatus } from '../types'
import { SYSTEMS } from './systems'

// Content checks for src/data/systems.ts: catch typos and gaps before the UI uses the data.

// Every article file in plan/articles/, read at test time by Vite
const articleFiles = Object.keys(import.meta.glob('../../plan/articles/*.md'))
const knownSources = new Set([
  ...articleFiles.map((path) => path.split('/').pop()!.replace(/\.md$/, '')),
  'challenge-statement', // plan/challenge-statement.md
])

const allIndicators: Indicator[] = SYSTEMS.flatMap((system) => system.indicators)
const STATUSES: ScoredStatus[] = ['green', 'amber', 'red']

const inBand = (band: Band, value: number) =>
  (band.min === undefined || value >= band.min) && (band.max === undefined || value < band.max)

describe('systems content', () => {
  it('uses known system ids, once each, in SYSTEM_IDS order', () => {
    const ids = SYSTEMS.map((system) => system.id)
    expect(new Set(ids).size).toBe(ids.length)
    const order = ids.map((id) => SYSTEM_IDS.indexOf(id))
    expect(order).toEqual([...order].sort((a, b) => a - b))
  })

  it('gives every indicator a unique id', () => {
    const ids = allIndicators.map((indicator) => indicator.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has actions for every status', () => {
    for (const system of SYSTEMS) {
      for (const status of STATUSES) {
        expect(system.actions[status].length, `${system.id} ${status}`).toBeGreaterThan(0)
      }
    }
  })

  it('places each pin in a free spot on the body figure', () => {
    const spots = SYSTEMS.map((system) => `${system.pin.side}-${system.pin.order}`)
    expect(new Set(spots).size).toBe(spots.length)
  })

  it('lays out the pins as in plan/branding.md §5', () => {
    const column = (side: 'left' | 'right') =>
      SYSTEMS.filter((system) => system.pin.side === side)
        .sort((a, b) => a.pin.order - b.pin.order)
        .map((system) => `${system.id}:${system.pin.label}`)
    expect(column('left')).toEqual([
      'mind:Mind & sleep',
      'eyes:Eyes & brain',
      'immune:Immune',
      'bones:Bones & muscles',
    ])
    expect(column('right')).toEqual([
      'balance:Balance',
      'heart:Heart',
      'metabolism:Metabolism',
      'radiation:Radiation',
    ])
  })

  it('has 8 systems and 28 indicators, matching plan/health-indicators.md row by row', () => {
    // Read the plan's table: | # | Indicator | Body system | Type | Source | Basis |
    const markdown = Object.values(
      import.meta.glob<string>('../../plan/health-indicators.md', {
        query: '?raw',
        import: 'default',
        eager: true,
      }),
    )[0]
    const planRows = markdown
      .split('\n')
      .filter((line) => /^\| \d+ \|/.test(line))
      .map((line) => {
        const cells = line.split('|').map((cell) => cell.trim())
        // "Heart & circulation" → "heart", "Eyes & brain (SANS)" → "eyes", …
        const systemId = cells[3].split(' ')[0].toLowerCase()
        return `${systemId}:${cells[4].toLowerCase()}`
      })
    const dataRows = SYSTEMS.flatMap((system) =>
      system.indicators.map((indicator) => `${system.id}:${indicator.sourceType}`),
    )

    expect(SYSTEMS).toHaveLength(8)
    expect(dataRows).toHaveLength(28)
    expect(dataRows).toEqual(planRows)
  })

  it('cites only sources that exist in plan/', () => {
    for (const system of SYSTEMS) {
      for (const source of [...system.sources, ...system.indicators.flatMap((i) => i.sources)]) {
        expect(knownSources.has(source), `${system.id}: unknown source "${source}"`).toBe(true)
      }
    }
  })

  it('matches each scoring kind to its input type', () => {
    for (const indicator of allIndicators) {
      const { kind } = indicator.scoring
      if (kind === 'pairBands') expect(indicator.input, indicator.id).toBe('numberPair')
      if (kind === 'yesNo') expect(indicator.input, indicator.id).toBe('yesNo')
      if (kind === 'checklist') {
        expect(indicator.input, indicator.id).toBe('checklist')
        expect(indicator.options?.length, indicator.id).toBeGreaterThan(0)
      }
      expect(indicator.howToMeasure.length, indicator.id).toBeGreaterThan(0)
    }
  })

  it('has well-formed bands with no gaps across the plausible range', () => {
    for (const indicator of allIndicators) {
      const { scoring, plausible } = indicator
      const bandSets =
        scoring.kind === 'bands'
          ? [scoring.bands]
          : scoring.kind === 'pairBands'
            ? [scoring.first, scoring.second]
            : []
      for (const bands of bandSets) {
        for (const band of bands) {
          if (band.min !== undefined && band.max !== undefined) {
            expect(band.min, `${indicator.id} band`).toBeLessThan(band.max)
          }
        }
        // Absolute-value bands must cover every plausible value (checked in 0.1 steps)
        const absolute =
          scoring.kind === 'pairBands' || (scoring.kind === 'bands' && !scoring.basis)
        if (absolute && plausible) {
          for (let v = plausible.min; v <= plausible.max; v = Math.round((v + 0.1) * 10) / 10) {
            expect(
              bands.some((band) => inBand(band, v)),
              `${indicator.id}: no band for ${v}`,
            ).toBe(true)
          }
        }
      }
    }
  })
})
