import type { IndicatorId } from '../types'

// When to recheck an indicator that is amber or red (from the systems' actions in
// plan/body-systems.md, e.g. "Recheck your temperature in 4–6 hours"). Used by the check-in
// summary (5.4) and turned into due tasks by the scheduler (6.1). Anything not listed: tomorrow.
export type RecheckRule = { label: string; hours: number }

export const RECHECKS: Partial<Record<IndicatorId, RecheckRule>> = {
  bodyTemperature: { label: 'in 4–6 h', hours: 5 },
  bloodPressure: { label: 'within 1 h', hours: 1 },
  restingHeartRate: { label: 'within 1 h', hours: 1 },
  bloodGlucose: { label: 'in 15 min', hours: 0.25 },
}

export const DEFAULT_RECHECK: RecheckRule = { label: 'tomorrow', hours: 24 }
