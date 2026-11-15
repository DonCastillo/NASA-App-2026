import { RATING_LABELS, SEVERITY_LABELS } from '../data/scales'
import type { Indicator, ReadingValue } from '../types'

// Turns a recorded value into short text for the UI and status sentences, e.g. "38.2 °C", "118/76 mmHg".

/** 62 → "62", 38.25 → "38.3": at most one decimal */
export function formatNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

function withUnit(text: string, unit?: string): string {
  if (!unit) return text
  return unit === '%' ? `${text}%` : `${text} ${unit}`
}

/** The word for a severity (0–3) or rating (1–5) value */
export function scaleWord(indicator: Indicator, value: number): string {
  if (indicator.input === 'rating') {
    return (indicator.scaleLabels ?? RATING_LABELS)[value - 1] ?? String(value)
  }
  return (indicator.scaleLabels ?? SEVERITY_LABELS)[value] ?? String(value)
}

/** A reading as short text. Skipped readings show as "Not recorded". */
export function formatReading(indicator: Indicator, value: ReadingValue | undefined): string {
  if (value === null || value === undefined) return 'Not recorded'

  if (Array.isArray(value)) {
    // numberPair, e.g. blood pressure → "118/76 mmHg"
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      return withUnit(`${formatNumber(value[0])}/${formatNumber(value[1])}`, indicator.unit)
    }
    // checklist → option labels
    const labels = (value as string[]).map(
      (id) => indicator.options?.find((option) => option.id === id)?.label ?? id,
    )
    return labels.length ? labels.join(', ') : 'None'
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No'

  if (indicator.input === 'severity' || indicator.input === 'rating') {
    return scaleWord(indicator, value)
  }
  return withUnit(formatNumber(value), indicator.unit)
}

/** One-way comms delay as text: "under 1 s", "1.3 s", "4 min" */
export function formatDelay(seconds: number): string {
  if (seconds < 1) return 'under 1 s'
  if (seconds < 60) return `${formatNumber(seconds)} s`
  return `${Math.round(seconds / 60)} min`
}

const signed = (value: number, unit = '') =>
  `${value > 0 ? '+' : value < 0 ? '−' : '±'}${formatNumber(Math.abs(value))}${unit}`

/**
 * A reading in words, relative to its reference when the indicator is scored that way, e.g.
 *   near vision 8 vs baseline 10 → "2 lines worse than baseline"
 *   strength 34 vs 40            → "85% of baseline"
 *   body mass 67.2 vs 70         → "−4% vs preflight"
 *   dose 270 vs budget 500       → "54% of mission budget"
 *   dose rate 6000 vs 1800       → "3.3× the normal rate"
 * Without a reference (or for plain indicators) it falls back to formatReading().
 */
export function describeReading(
  indicator: Indicator,
  value: ReadingValue | undefined,
  reference?: number,
): string {
  const basis = indicator.scoring.kind === 'bands' ? indicator.scoring.basis : undefined
  if (!basis || typeof value !== 'number' || reference === undefined || reference === 0) {
    return formatReading(indicator, value)
  }
  switch (basis) {
    case 'changeFromBaseline': {
      const change = value - reference
      // "1 line", "2 lines"
      const plural = indicator.unit ?? ''
      const unit = Math.abs(change) === 1 && plural.endsWith('s') ? plural.slice(0, -1) : plural
      if (change === 0) return 'same as baseline'
      return `${formatNumber(Math.abs(change))} ${unit} ${change < 0 ? 'worse' : 'better'} than baseline`.replace(
        /\s+/g,
        ' ',
      )
    }
    case 'percentOfBaseline':
      return `${Math.round((value / reference) * 100)}% of baseline`
    case 'percentChangeFromBaseline':
      return `${signed(Math.round(((value - reference) / reference) * 1000) / 10, '%')} vs preflight`
    case 'percentOfBudget':
      return `${Math.round((value / reference) * 100)}% of mission budget`
    case 'multipleOfBaseline':
      return `${formatNumber(value / reference)}× the normal rate`
    default:
      return formatReading(indicator, value)
  }
}
