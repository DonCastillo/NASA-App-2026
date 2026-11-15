import type { Settings } from '../lib/storage'

/** Start a test store past the first-visit Welcome and tour, which would cover the Body Map */
export const ONBOARDED: Partial<Settings> = { welcomeSeen: true, tourSeen: true }
