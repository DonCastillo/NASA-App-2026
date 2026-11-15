import type { TaskTone } from '../lib/scheduler'

/** Text color class per task tone (theme tokens only), for the 🔔 list and the Routine page */
export const TONE_TEXT: Record<TaskTone, string> = {
  alert: 'text-alert-text',
  warn: 'text-warn',
  accent: 'text-accent',
  muted: 'text-text-muted',
  ok: 'text-ok',
}
