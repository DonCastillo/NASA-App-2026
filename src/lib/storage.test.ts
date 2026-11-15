import { beforeEach, describe, expect, it } from 'vitest'
import { DEMO_CREW } from '../data/demoCrew'
import type { CheckIn, CheckInDraft, MissionEvent, Profile } from '../types'
import { generateDemoData } from './seed'
import {
  STORAGE_KEY,
  type KeyValueStorage,
  addCheckIn,
  addEvent,
  clearData,
  clearDraft,
  deleteProfile,
  emptyData,
  loadData,
  mergeDataset,
  resetDemoData,
  saveData,
  saveDraft,
  saveProfile,
  updateSettings,
} from './storage'

/** An in-memory stand-in for localStorage */
function memoryStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}

const TODAY = new Date(2026, 10, 15, 9, 0)
const DEMO_IDS = DEMO_CREW.map((c) => c.id)

const me: Profile = {
  id: 'user-1',
  name: 'Don',
  isDemo: false,
  supplements: [],
  baselines: {},
  mission: { profileId: 'iss', startDate: '2026-11-01', lengthDays: 180 },
}

const checkIn = (
  id: string,
  profileId: string,
  day: number,
  missionId?: CheckIn['missionId'],
): CheckIn => ({
  id,
  profileId,
  missionId,
  mode: { kind: 'daily' },
  startedAt: new Date(2026, 10, day, 8).toISOString(),
  completedAt: new Date(2026, 10, day, 8, 2).toISOString(),
  readings: [
    {
      indicatorId: 'bodyTemperature',
      value: 36.8,
      recordedAt: new Date(2026, 10, day, 8).toISOString(),
    },
  ],
  countermeasures: [],
  note: 'Felt fine',
})

/** An unfinished check-in (answers so far + the question the user was on) */
const draft = (id: string, profileId: string): CheckInDraft => ({
  id,
  profileId,
  mode: { kind: 'daily' },
  startedAt: new Date(2026, 10, 15, 8).toISOString(),
  answers: { bodyTemperature: 36.8 },
  index: 3,
})

const event = (id: string, profileId: string): MissionEvent => ({
  id,
  profileId,
  type: 'spacewalk',
  at: new Date(2026, 10, 14, 14).toISOString(),
})

describe('load and save', () => {
  let storage: ReturnType<typeof memoryStorage>
  beforeEach(() => {
    storage = memoryStorage()
  })

  it('starts empty and round-trips saved data under the versioned key', () => {
    expect(loadData(storage)).toEqual(emptyData())
    const data = saveProfile(emptyData(), me)
    expect(saveData(data, storage)).toBe(true)
    expect(storage.map.has(STORAGE_KEY)).toBe(true)
    expect(STORAGE_KEY).toBe('bodymap:v1')
    expect(loadData(storage)).toEqual(data)
  })

  it('ignores broken JSON, the wrong shape and old versions', () => {
    storage.setItem(STORAGE_KEY, '{not json')
    expect(loadData(storage)).toEqual(emptyData())
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, profiles: 'nope' }))
    expect(loadData(storage)).toEqual(emptyData())
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyData(), version: 0 }))
    expect(loadData(storage)).toEqual(emptyData())
  })

  it('fills settings added in later versions with defaults', () => {
    const saved = { ...emptyData(), settings: { welcomeSeen: true } }
    storage.setItem(STORAGE_KEY, JSON.stringify(saved))
    expect(loadData(storage).settings).toEqual({
      welcomeSeen: true,
      tourSeen: false,
      hintsSeen: [],
    })
  })

  it('treats an incomplete storage object as unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', { value: {}, configurable: true })
    try {
      expect(saveData(emptyData())).toBe(false)
      expect(loadData()).toEqual(emptyData())
    } finally {
      if (original) Object.defineProperty(window, 'localStorage', original)
    }
  })

  it('keeps working when storage is missing, blocked or full', () => {
    expect(loadData(null)).toEqual(emptyData())
    expect(saveData(emptyData(), null)).toBe(false)
    const blocked: KeyValueStorage = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {
        throw new Error('SecurityError')
      },
    }
    expect(loadData(blocked)).toEqual(emptyData())
    expect(saveData(emptyData(), blocked)).toBe(false)
    expect(() => clearData(blocked)).not.toThrow()
  })

  it('clears everything BodyMap saved', () => {
    saveData(saveProfile(emptyData(), me), storage)
    clearData(storage)
    expect(storage.map.size).toBe(0)
  })

  it('also works with the browser localStorage (jsdom)', () => {
    const data = updateSettings(emptyData(), { welcomeSeen: true })
    expect(saveData(data)).toBe(true)
    expect(loadData().settings.welcomeSeen).toBe(true)
    clearData()
    expect(loadData()).toEqual(emptyData())
  })
})

describe('update helpers', () => {
  it('adds a check-in (with answers and note) and clears that profile’s draft', () => {
    let data = saveDraft(emptyData(), draft('draft', me.id))
    expect(Object.keys(data.drafts)).toEqual([me.id])
    data = addCheckIn(data, checkIn('c1', me.id, 15))
    expect(data.checkIns.map((c) => c.id)).toEqual(['c1'])
    expect(data.checkIns[0].note).toBe('Felt fine')
    expect(data.drafts).toEqual({})
  })

  it('replaces a check-in with the same id instead of duplicating it', () => {
    let data = addCheckIn(emptyData(), checkIn('c1', me.id, 15))
    data = addCheckIn(data, { ...checkIn('c1', me.id, 15), note: 'Edited' })
    expect(data.checkIns).toHaveLength(1)
    expect(data.checkIns[0].note).toBe('Edited')
  })

  it('saves and clears drafts per profile', () => {
    let data = saveDraft(emptyData(), draft('d1', me.id))
    data = saveDraft(data, draft('d2', 'demo-vega'))
    data = clearDraft(data, me.id)
    expect(Object.keys(data.drafts)).toEqual(['demo-vega'])
  })

  it('adds and updates profiles, and adds events', () => {
    let data = saveProfile(emptyData(), me)
    data = saveProfile(data, { ...me, name: 'Don C.' })
    expect(data.profiles).toEqual([{ ...me, name: 'Don C.' }])
    data = addEvent(data, event('e1', me.id))
    expect(data.events.map((e) => e.id)).toEqual(['e1'])
  })

  it('deletes one user profile with all its data, and unselects it', () => {
    let data = saveProfile(emptyData(), me)
    data = saveProfile(data, { ...me, id: 'user-2', name: 'Sam' })
    data = addCheckIn(data, checkIn('c1', me.id, 15))
    data = addCheckIn(data, checkIn('c2', 'user-2', 15))
    data = addEvent(data, event('e1', me.id))
    data = saveDraft(data, draft('d1', me.id))
    data = updateSettings(data, { selectedProfileId: me.id })

    data = deleteProfile(data, me.id)
    expect(data.profiles.map((p) => p.id)).toEqual(['user-2'])
    expect(data.checkIns.map((c) => c.id)).toEqual(['c2'])
    expect(data.events).toEqual([])
    expect(data.drafts).toEqual({})
    expect(data.settings.selectedProfileId).toBeUndefined()
  })

  it('"Reset demo data" removes only additions for demo crew; user profiles stay', () => {
    let data = saveProfile(emptyData(), me)
    data = addCheckIn(data, checkIn('mine', me.id, 15))
    data = addCheckIn(data, checkIn('demo-add', 'demo-vega', 15, 'mars'))
    data = addEvent(data, event('demo-event', 'demo-okafor'))
    data = saveDraft(data, draft('demo-draft', 'demo-lindqvist'))

    data = resetDemoData(data, DEMO_IDS)
    expect(data.profiles).toEqual([me])
    expect(data.checkIns.map((c) => c.id)).toEqual(['mine'])
    expect(data.events).toEqual([])
    expect(data.drafts).toEqual({})
  })
})

describe('mergeDataset', () => {
  it('layers saved additions on top of the generated demo history, in time order', () => {
    const demo = generateDemoData(DEMO_CREW[0], 'mars', TODAY)
    // A recheck later today, added by a user on Mars
    const recheck = {
      ...checkIn('recheck', 'demo-vega', 15, 'mars'),
      startedAt: new Date(2026, 10, 15, 13).toISOString(),
    }
    const data = addCheckIn(emptyData(), recheck)

    const merged = mergeDataset(demo.profile, data, demo)
    expect(merged.checkIns).toHaveLength(demo.checkIns.length + 1)
    expect(merged.checkIns[merged.checkIns.length - 1].id).toBe('recheck')
    expect(merged.events).toEqual(demo.events)
  })

  it('keeps additions on the mission they were made on', () => {
    const issDemo = generateDemoData(DEMO_CREW[0], 'iss', TODAY)
    const data = addCheckIn(emptyData(), checkIn('on-mars', 'demo-vega', 15, 'mars'))
    const merged = mergeDataset(issDemo.profile, data, issDemo)
    expect(merged.checkIns.some((c) => c.id === 'on-mars')).toBe(false)
  })

  it('returns only saved data for a user profile', () => {
    let data = saveProfile(emptyData(), me)
    data = addCheckIn(data, checkIn('c2', me.id, 16))
    data = addCheckIn(data, checkIn('c1', me.id, 15))
    data = addCheckIn(data, checkIn('other', 'user-2', 15))
    const merged = mergeDataset(me, data)
    expect(merged.checkIns.map((c) => c.id)).toEqual(['c1', 'c2'])
  })
})
