import { describe, expect, it } from 'vitest'
import { type KeyValueStorage, STORAGE_KEY, loadData } from '../lib/storage'
import type { CheckIn, Profile } from '../types'
import { DEFAULT_MISSION, DEMO_IDS, createAppStore } from './appStore'
import { selectDataset, selectHealth, selectMission, selectProfiles } from './selectors'

const TODAY = new Date(2026, 10, 15, 9, 0)

function memoryStorage(): KeyValueStorage & { map: Map<string, string> } {
  const map = new Map<string, string>()
  return {
    map,
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  }
}

const newStore = (storage = memoryStorage()) => ({
  storage,
  store: createAppStore({ storage, today: TODAY }),
})

const me: Profile = {
  id: 'user-1',
  name: 'Don',
  isDemo: false,
  supplements: [],
  baselines: {},
  mission: { profileId: 'iss', startDate: '2026-11-01', lengthDays: 180 },
}

/** A recheck later today with a high temperature */
const feverRecheck = (profileId: string): CheckIn => {
  const at = new Date(2026, 10, 15, 13, 0).toISOString()
  return {
    id: `recheck-${profileId}`,
    profileId,
    missionId: 'mars',
    mode: { kind: 'system', systemId: 'immune' },
    startedAt: at,
    completedAt: at,
    readings: [{ indicatorId: 'bodyTemperature', value: 38.6, recordedAt: at }],
    countermeasures: [],
  }
}

describe('app store: start', () => {
  it('starts on the first demo crew member and the default mission', () => {
    const { store } = newStore()
    expect(store.getState().selectedProfileId).toBe(DEMO_IDS[0])
    expect(store.getState().selectedMissionId).toBe(DEFAULT_MISSION)
    expect(selectMission(store.getState()).id).toBe('mars')
  })

  it('restores the saved selection on the next start', () => {
    const { storage, store } = newStore()
    store.getState().selectProfile('demo-okafor')
    store.getState().selectMission('iss')
    const { store: again } = newStore(storage)
    expect(again.getState().selectedProfileId).toBe('demo-okafor')
    expect(again.getState().selectedMissionId).toBe('iss')
  })

  it('falls back to the first demo crew member if the saved one no longer exists', () => {
    const storage = memoryStorage()
    const { store } = newStore(storage)
    store.getState().saveProfile(me)
    store.getState().selectProfile(me.id)
    // Simulate the profile disappearing from saved data
    const data = loadData(storage)
    storage.setItem(STORAGE_KEY, JSON.stringify({ ...data, profiles: [] }))
    expect(newStore(storage).store.getState().selectedProfileId).toBe(DEMO_IDS[0])
  })
})

describe('app store: actions save every change', () => {
  it('lists demo crew plus user profiles', () => {
    const { store } = newStore()
    store.getState().saveProfile(me)
    const names = selectProfiles(store.getState()).map((p) => p.name)
    expect(names).toEqual(['Cmdr. Vega', 'Dr. Okafor', 'Eng. Lindqvist', 'Don'])
  })

  it('adds a check-in for a demo crew member on top of the generated history', () => {
    const { storage, store } = newStore()
    const before = selectDataset(store.getState()).checkIns.length
    store.getState().addCheckIn(feverRecheck('demo-vega'))
    expect(selectDataset(store.getState()).checkIns).toHaveLength(before + 1)
    expect(selectHealth(store.getState()).systems.immune.status).toBe('red')
    expect(loadData(storage).checkIns).toHaveLength(1) // only the addition is saved
  })

  it('"Reset demo data" removes demo additions and restores the generated history', () => {
    const { store } = newStore()
    store.getState().addCheckIn(feverRecheck('demo-vega'))
    store.getState().resetDemoData()
    expect(selectHealth(store.getState()).systems.immune.status).not.toBe('red')
  })

  it('switches a user profile’s mission when the mission changes', () => {
    const { store } = newStore()
    store.getState().saveProfile(me)
    store.getState().selectProfile(me.id)
    store.getState().selectMission('artemis')
    const profile = selectDataset(store.getState()).profile
    expect(profile.mission).toMatchObject({
      profileId: 'artemis',
      lengthDays: 30,
      startDate: '2026-11-01',
    })
  })

  it('deletes the selected user profile and goes back to the demo crew', () => {
    const { storage, store } = newStore()
    store.getState().saveProfile(me)
    store.getState().selectProfile(me.id)
    store.getState().deleteProfile(me.id)
    expect(store.getState().selectedProfileId).toBe(DEMO_IDS[0])
    expect(loadData(storage).profiles).toEqual([])
    expect(loadData(storage).settings.selectedProfileId).toBe(DEMO_IDS[0])
  })

  it('ignores selecting a profile that does not exist', () => {
    const { store } = newStore()
    store.getState().selectProfile('nobody')
    expect(store.getState().selectedProfileId).toBe(DEMO_IDS[0])
  })

  it('saves drafts and settings', () => {
    const { storage, store } = newStore()
    store.getState().saveDraft({
      id: 'd1',
      profileId: 'demo-vega',
      mode: { kind: 'daily' },
      startedAt: TODAY.toISOString(),
      answers: { bodyTemperature: 36.8 },
      index: 2,
    })
    store.getState().updateSettings({ welcomeSeen: true })
    const saved = loadData(storage)
    expect(Object.keys(saved.drafts)).toEqual(['demo-vega'])
    expect(saved.settings.welcomeSeen).toBe(true)
  })

  it('remembers each first-time hint once', () => {
    const { storage, store } = newStore()
    store.getState().markHintSeen('checkIn')
    store.getState().markHintSeen('checkIn')
    expect(loadData(storage).settings.hintsSeen).toEqual(['checkIn'])
  })
})

describe('selectors are memoized', () => {
  it('return the same object until something changes', () => {
    const { store } = newStore()
    const first = selectHealth(store.getState())
    expect(selectHealth(store.getState())).toBe(first)
    expect(selectProfiles(store.getState())).toBe(selectProfiles(store.getState()))
    store.getState().selectProfile('demo-okafor')
    expect(selectHealth(store.getState())).not.toBe(first)
  })
})
