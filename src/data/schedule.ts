import type { IndicatorId } from '../types'

// The mission routine's weekly schedule (plan/body-systems.md → Tiers → Weekly: "one day a week,
// spread across the week"). Mission day % 7 → which weekly item is due that day.
// Shared by the demo seed (src/lib/seed.ts) and the task scheduler (src/lib/scheduler.ts).
export const WEEKLY_SLOTS: Partial<Record<IndicatorId, number>> = {
  nearVision: 1,
  strengthTest: 2,
  bodyMass: 3,
  bloodGlucose: 4,
  cumulativeDose: 5,
  crewRelations: 6,
}

/** Weekly bone medication is answered on this slot */
export const BONE_MEDICATION_SLOT = 0

/** Daily check-in: due from this hour, overdue after `DAILY_OVERDUE_HOUR` */
export const DAILY_DUE_HOUR = 6
export const DAILY_OVERDUE_HOUR = 12
