import type { CheckIn, CheckInDraft, MissionEvent, MissionProfileId, Profile } from '../types'
import type { DemoDataset } from './seed'

// The only module that touches localStorage (plan/tasks.md 2.4, CLAUDE.md → Architecture rules).
// Saves only what users enter. Demo crew history is generated on load (src/lib/seed.ts) and never
// stored; anything a user adds for a demo crew member is saved and layered on top.
//
// Update helpers are pure: they return new data. The app store (src/state) saves the result.

/** Bump when the saved shape changes; old saved data is then ignored */
export const STORAGE_VERSION = 1
export const STORAGE_KEY = `bodymap:v${STORAGE_VERSION}`

export type Settings = {
  selectedProfileId?: string
  selectedMissionId?: MissionProfileId
  welcomeSeen: boolean
  tourSeen: boolean
  /** First-time hints already shown, e.g. "checkIn", "systemDetail" */
  hintsSeen: string[]
}

export type StoredData = {
  version: typeof STORAGE_VERSION
  /** Profiles created by users (demo crew profiles are not stored) */
  profiles: Profile[]
  /** Completed check-ins, with their countermeasure answers and notes */
  checkIns: CheckIn[]
  events: MissionEvent[]
  /** One in-progress check-in per profile, resumed when the user comes back */
  drafts: Record<string, CheckInDraft>
  settings: Settings
}

/** The small part of the Web Storage API we use (localStorage, or a fake in tests).
 *  Functions take `null` for "no storage available" (undefined would use the browser default). */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function emptyData(): StoredData {
  return {
    version: STORAGE_VERSION,
    profiles: [],
    checkIns: [],
    events: [],
    drafts: {},
    settings: { welcomeSeen: false, tourSeen: false, hintsSeen: [] },
  }
}

/** localStorage, or null where it's missing, blocked (e.g. some private windows) or incomplete */
export function browserStorage(): KeyValueStorage | null {
  try {
    const storage = typeof window !== 'undefined' ? window.localStorage : undefined
    const usable =
      typeof storage?.getItem === 'function' &&
      typeof storage.setItem === 'function' &&
      typeof storage.removeItem === 'function'
    return usable ? storage : null
  } catch {
    return null
  }
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Light shape check, so broken or old saved data can't crash the app */
function isStoredData(value: unknown): value is StoredData {
  return (
    isObject(value) &&
    value.version === STORAGE_VERSION &&
    Array.isArray(value.profiles) &&
    Array.isArray(value.checkIns) &&
    Array.isArray(value.events) &&
    isObject(value.drafts) &&
    isObject(value.settings)
  )
}

/** Read saved data. Missing, blocked, invalid or old-version data → empty data */
export function loadData(storage: KeyValueStorage | null = browserStorage()): StoredData {
  if (!storage) return emptyData()
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredData(parsed)) return emptyData()
    // Fill in any settings added later with their defaults
    return { ...parsed, settings: { ...emptyData().settings, ...parsed.settings } }
  } catch {
    return emptyData()
  }
}

/** Save data. Returns false if storage is unavailable or full (the app keeps working in memory) */
export function saveData(
  data: StoredData,
  storage: KeyValueStorage | null = browserStorage(),
): boolean {
  if (!storage) return false
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

/** Remove everything BodyMap saved */
export function clearData(storage: KeyValueStorage | null = browserStorage()): void {
  try {
    storage?.removeItem(STORAGE_KEY)
  } catch {
    // nothing to clear
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Update helpers (pure: data in → new data out)
// ─────────────────────────────────────────────────────────────────────────────

/** Add or replace a completed check-in; clears that profile's draft */
export function addCheckIn(data: StoredData, checkIn: CheckIn): StoredData {
  const { [checkIn.profileId]: _draft, ...drafts } = data.drafts
  return {
    ...data,
    checkIns: [...data.checkIns.filter((c) => c.id !== checkIn.id), checkIn],
    drafts,
  }
}

export function saveDraft(data: StoredData, draft: CheckInDraft): StoredData {
  return { ...data, drafts: { ...data.drafts, [draft.profileId]: draft } }
}

export function clearDraft(data: StoredData, profileId: string): StoredData {
  const { [profileId]: _draft, ...drafts } = data.drafts
  return { ...data, drafts }
}

export function addEvent(data: StoredData, event: MissionEvent): StoredData {
  return { ...data, events: [...data.events.filter((e) => e.id !== event.id), event] }
}

/** Add a new user profile, or update an existing one (same id) */
export function saveProfile(data: StoredData, profile: Profile): StoredData {
  const exists = data.profiles.some((p) => p.id === profile.id)
  return {
    ...data,
    profiles: exists
      ? data.profiles.map((p) => (p.id === profile.id ? profile : p))
      : [...data.profiles, profile],
  }
}

/** Remove one user profile and all of its check-ins, events and draft */
export function deleteProfile(data: StoredData, profileId: string): StoredData {
  const { [profileId]: _draft, ...drafts } = data.drafts
  const wasSelected = data.settings.selectedProfileId === profileId
  return {
    ...data,
    profiles: data.profiles.filter((p) => p.id !== profileId),
    checkIns: data.checkIns.filter((c) => c.profileId !== profileId),
    events: data.events.filter((e) => e.profileId !== profileId),
    drafts,
    settings: wasSelected ? { ...data.settings, selectedProfileId: undefined } : data.settings,
  }
}

/** "Reset demo data": delete only what users added for demo crew members; user profiles stay */
export function resetDemoData(data: StoredData, demoProfileIds: string[]): StoredData {
  const isDemo = (profileId: string) => demoProfileIds.includes(profileId)
  return {
    ...data,
    checkIns: data.checkIns.filter((c) => !isDemo(c.profileId)),
    events: data.events.filter((e) => !isDemo(e.profileId)),
    drafts: Object.fromEntries(Object.entries(data.drafts).filter(([id]) => !isDemo(id))),
  }
}

export function updateSettings(data: StoredData, changes: Partial<Settings>): StoredData {
  return { ...data, settings: { ...data.settings, ...changes } }
}

// ─────────────────────────────────────────────────────────────────────────────
// Combining generated demo history with saved additions
// ─────────────────────────────────────────────────────────────────────────────

const byTime =
  <T>(time: (item: T) => string) =>
  (a: T, b: T) =>
    new Date(time(a)).getTime() - new Date(time(b)).getTime()

/** True if an item belongs to this profile on this mission (items without a mission count for any) */
const belongsTo = (
  item: { profileId: string; missionId?: MissionProfileId },
  profileId: string,
  missionId: MissionProfileId,
) => item.profileId === profileId && (item.missionId === undefined || item.missionId === missionId)

/**
 * One crew member's full data on a mission: generated demo history (if any) plus saved additions,
 * oldest first. For a user profile, pass `demo` as undefined.
 */
export function mergeDataset(
  profile: Profile,
  data: StoredData,
  demo?: DemoDataset,
): { profile: Profile; checkIns: CheckIn[]; events: MissionEvent[] } {
  const missionId = profile.mission.profileId
  const savedCheckIns = data.checkIns.filter((c) => belongsTo(c, profile.id, missionId))
  const savedEvents = data.events.filter((e) => belongsTo(e, profile.id, missionId))
  return {
    profile,
    checkIns: [...(demo?.checkIns ?? []), ...savedCheckIns].sort(byTime((c) => c.startedAt)),
    events: [...(demo?.events ?? []), ...savedEvents].sort(byTime((e) => e.at)),
  }
}
