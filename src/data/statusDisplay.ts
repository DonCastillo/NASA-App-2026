import type { Status } from '../types'

// How each status looks everywhere in the app (plan/branding.md §2): color + icon + word,
// never color alone. Colors are theme tokens (CSS variables from src/index.css).
export const STATUS_DISPLAY: Record<
  Status,
  { word: string; icon: string; color: string; textColor: string }
> = {
  green: { word: 'OK', icon: '✓', color: 'var(--color-ok)', textColor: 'var(--color-ok)' },
  amber: { word: 'Watch', icon: '⚠', color: 'var(--color-warn)', textColor: 'var(--color-warn)' },
  red: {
    word: 'Act',
    icon: '✖',
    color: 'var(--color-alert)',
    textColor: 'var(--color-alert-text)',
  },
  none: {
    word: 'Not recorded',
    icon: '–',
    color: 'var(--color-none)',
    textColor: 'var(--color-text-muted)',
  },
}
