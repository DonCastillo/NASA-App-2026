import { differenceInCalendarDays } from 'date-fns'
import { COUNTERMEASURES } from '../data/countermeasures'
import type { CheckIn, Indicator, IndicatorId, MissionEvent, ScoredStatus, Status } from '../types'
import { formatReading } from './format'
import { scoreIndicator } from './status'
import { type HistoryPoint, dailyPoints } from './trends'

// Chart data for System detail trends (plan/tasks.md 4.4). Pure: the components only draw.
// The x-axis is the mission day (Day 1 = start date), matching the header's "Day 150/210".

export type ChartRange = '7d' | '30d' | 'mission'

/** First mission day shown for a range (the last is today's mission day) */
export function rangeStartDay(range: ChartRange, currentDay: number): number {
  if (range === '7d') return Math.max(1, currentDay - 6)
  if (range === '30d') return Math.max(1, currentDay - 29)
  return 1
}

/** Mission day of a date, counting back from today's mission day */
export function missionDayOf(iso: string, today: Date, currentDay: number): number {
  return currentDay - differenceInCalendarDays(today, new Date(iso))
}

// ─────────────────────────────────────────────────────────────────────────────
// Number charts
// ─────────────────────────────────────────────────────────────────────────────

/** A status band in the reading's own units (kg, mSv…), for the chart background */
export type RawBand = { status: ScoredStatus; from?: number; to?: number }

/**
 * Bands converted from the indicator's scoring space back to raw units, so the chart can show the
 * real values. E.g. strength "<80% of baseline" with a 60 kg baseline → below 48 kg.
 * Returns [] when a needed reference is missing. Blood pressure uses the systolic bands.
 */
export function rawBands(indicator: Indicator, reference?: number): RawBand[] {
  const { scoring } = indicator
  const bands =
    scoring.kind === 'bands' ? scoring.bands : scoring.kind === 'pairBands' ? scoring.first : []
  const basis = scoring.kind === 'bands' ? (scoring.basis ?? 'absolute') : 'absolute'
  const toRaw = (edge: number | undefined): number | undefined => {
    if (edge === undefined) return undefined
    switch (basis) {
      case 'absolute':
        return edge
      case 'changeFromBaseline':
        return reference! + edge
      case 'percentOfBaseline':
      case 'percentOfBudget':
        return (edge / 100) * reference!
      case 'percentChangeFromBaseline':
        return reference! * (1 + edge / 100)
      case 'multipleOfBaseline':
        return edge * reference!
    }
  }
  if (basis !== 'absolute' && reference === undefined) return []
  return bands.map((band) => ({ status: band.status, from: toRaw(band.min), to: toRaw(band.max) }))
}

export type ChartPoint = { day: number; value: number; value2?: number; recordedAt: string }

/** Numeric points in range, one per day (number pairs fill value + value2) */
export function numberSeries(
  history: HistoryPoint[],
  today: Date,
  currentDay: number,
  fromDay: number,
): ChartPoint[] {
  return dailyPoints(history).flatMap((point) => {
    const day = missionDayOf(point.recordedAt, today, currentDay)
    if (day < fromDay || day > currentDay) return []
    const { value } = point
    if (typeof value === 'number') return [{ day, value, recordedAt: point.recordedAt }]
    if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
      return [{ day, value: value[0], value2: value[1], recordedAt: point.recordedAt }]
    }
    return []
  })
}

/** Y-axis range: the data (and baseline) with a little padding, so bands don't flatten the line */
export function yDomain(points: ChartPoint[], baseline?: number): [number, number] {
  const values = points.flatMap((p) => (p.value2 === undefined ? [p.value] : [p.value, p.value2]))
  if (baseline !== undefined) values.push(baseline)
  if (!values.length) return [0, 1]
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max((max - min) * 0.25, Math.abs(max) * 0.02, 0.5)
  return [Math.floor((min - pad) * 10) / 10, Math.ceil((max + pad) * 10) / 10]
}

// ─────────────────────────────────────────────────────────────────────────────
// Status timelines (scales, yes/no, checklists)
// ─────────────────────────────────────────────────────────────────────────────

export type TimelineDay = { day: number; status: Status; label: string }

/** One entry per mission day in range; days without a reading are 'none' */
export function statusTimeline(
  indicator: Indicator,
  history: HistoryPoint[],
  today: Date,
  currentDay: number,
  fromDay: number,
  reference?: number,
): TimelineDay[] {
  const byDay = new Map<number, HistoryPoint>()
  for (const point of dailyPoints(history)) {
    byDay.set(missionDayOf(point.recordedAt, today, currentDay), point)
  }
  const days: TimelineDay[] = []
  for (let day = fromDay; day <= currentDay; day++) {
    const point = byDay.get(day)
    days.push(
      point
        ? {
            day,
            status: scoreIndicator(indicator, point.value, reference),
            label: formatReading(indicator, point.value),
          }
        : { day, status: 'none', label: 'Not recorded' },
    )
  }
  return days
}

// ─────────────────────────────────────────────────────────────────────────────
// Markers
// ─────────────────────────────────────────────────────────────────────────────

const EVENT_SHORT: Record<MissionEvent['type'], string> = {
  spacewalk: 'EVA',
  landing: 'Landing',
  gravityTransition: 'Gravity',
}

export type Marker = { day: number; label: string; kind: 'event' | 'countermeasure' }

/** Answers that count as "did it" (No / Not yet / Missed are not marked) */
const isYes = (answer: string) => !/^(no|not yet|missed)/i.test(answer)

/** Events in range, and "yes" countermeasure answers related to this indicator */
export function chartMarkers(
  indicatorId: IndicatorId,
  events: MissionEvent[],
  checkIns: CheckIn[],
  today: Date,
  currentDay: number,
  fromDay: number,
): Marker[] {
  const inRange = (day: number) => day >= fromDay && day <= currentDay
  const markers: Marker[] = events
    .map((event) => ({
      day: missionDayOf(event.at, today, currentDay),
      label: EVENT_SHORT[event.type],
      kind: 'event' as const,
    }))
    .filter((m) => inRange(m.day))

  const related = new Map(
    COUNTERMEASURES.filter((q) => q.relatedIndicators.includes(indicatorId)).map((q) => [q.id, q]),
  )
  for (const checkIn of checkIns) {
    for (const answer of checkIn.countermeasures) {
      const question = related.get(answer.questionId)
      if (!question || !isYes(answer.answer)) continue
      const day = missionDayOf(answer.recordedAt, today, currentDay)
      if (inRange(day)) {
        markers.push({
          day,
          label: `${question.question} ${answer.answer}`,
          kind: 'countermeasure',
        })
      }
    }
  }
  return markers.sort((a, b) => a.day - b.day)
}

/**
 * The dashed baseline line for a chart, in raw units: the preflight reference for baseline-relative
 * indicators, or the setup baseline (systolic for blood pressure). None for budget / rate indicators.
 */
export function chartBaseline(
  indicator: Indicator,
  reference: number | undefined,
  setup: number | [number, number] | undefined,
): number | undefined {
  const basis = indicator.scoring.kind === 'bands' ? indicator.scoring.basis : undefined
  if (basis === 'percentOfBudget' || basis === 'multipleOfBaseline') return undefined
  if (basis) return reference
  return Array.isArray(setup) ? setup[0] : setup
}
