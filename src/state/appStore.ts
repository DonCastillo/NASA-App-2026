import { createStore } from 'zustand/vanilla'
import { DEMO_CREW } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import type { CheckIn, MissionEvent, MissionProfileId, Profile } from '../types'
import {
  type KeyValueStorage,
  type Settings,
  type StoredData,
  addCheckIn,
  addEvent,
  browserStorage,
  clearDraft,
  deleteProfile,
  loadData,
  resetDemoData,
  saveData,
  saveDraft,
  saveProfile,
  updateSettings,
} from '../lib/storage'

// The app store (plan/tasks.md 2.5): what is selected, everything the user has saved, and the actions
// that change them. Loaded from storage on start; saved after every change.
// Screens read through src/state/selectors.ts and the hooks in src/state/useAppStore.ts.

export const DEFAULT_MISSION: MissionProfileId = 'mars'
export const DEMO_IDS = DEMO_CREW.map((crew) => crew.id)

export type AppState = {
  /** The date the app treats as today (fixed in tests) */
  today: Date
  /** Everything saved in storage */
  stored: StoredData
  selectedProfileId: string
  /** Mission shown for demo crew; a user profile uses its own mission */
  selectedMissionId: MissionProfileId

  selectProfile: (profileId: string) => void
  selectMission: (missionId: MissionProfileId) => void
  addCheckIn: (checkIn: CheckIn) => void
  saveDraft: (draft: CheckIn) => void
  clearDraft: (profileId: string) => void
  addEvent: (event: MissionEvent) => void
  saveProfile: (profile: Profile) => void
  deleteProfile: (profileId: string) => void
  resetDemoData: () => void
  updateSettings: (changes: Partial<Settings>) => void
  /** Move "today" forward, e.g. when the app stays open past midnight */
  setToday: (today: Date) => void
}

export type AppStoreOptions = {
  /** Where to load and save; defaults to the browser's localStorage (null = memory only) */
  storage?: KeyValueStorage | null
  today?: Date
}

export function createAppStore({
  storage = browserStorage(),
  today = new Date(),
}: AppStoreOptions = {}) {
  const stored = loadData(storage)
  console.log('Loaded stored data', stored)
  const known = (id?: string) =>
    id !== undefined && (DEMO_IDS.includes(id) || stored.profiles.some((p) => p.id === id))

  return createStore<AppState>()((set, get) => {
    /** Apply a change to the saved data, save it, and keep selection settings in sync */
    const commit = (next: StoredData, selection: Partial<AppState> = {}) => {
      const state = { ...get(), ...selection }
      const withSelection = updateSettings(next, {
        selectedProfileId: state.selectedProfileId,
        selectedMissionId: state.selectedMissionId,
      })
      saveData(withSelection, storage)
      set({ ...selection, stored: withSelection })
    }

    return {
      today,
      stored,
      selectedProfileId: known(stored.settings.selectedProfileId)
        ? stored.settings.selectedProfileId!
        : DEMO_IDS[0],
      selectedMissionId: stored.settings.selectedMissionId ?? DEFAULT_MISSION,

      selectProfile: (profileId) => {
        if (!known(profileId) && !get().stored.profiles.some((p) => p.id === profileId)) return
        commit(get().stored, { selectedProfileId: profileId })
      },

      selectMission: (missionId) => {
        const { stored: data, selectedProfileId } = get()
        const userProfile = data.profiles.find((p) => p.id === selectedProfileId)
        // A user profile's mission changes too (keeping its start date)
        const next = userProfile
          ? saveProfile(data, {
              ...userProfile,
              mission: {
                ...userProfile.mission,
                profileId: missionId,
                lengthDays: MISSIONS[missionId].defaultLengthDays,
              },
            })
          : data
        commit(next, { selectedMissionId: missionId })
      },

      addCheckIn: (checkIn) => commit(addCheckIn(get().stored, checkIn)),
      saveDraft: (draft) => commit(saveDraft(get().stored, draft)),
      clearDraft: (profileId) => commit(clearDraft(get().stored, profileId)),
      addEvent: (event) => commit(addEvent(get().stored, event)),
      saveProfile: (profile) => commit(saveProfile(get().stored, profile)),

      deleteProfile: (profileId) => {
        const wasSelected = get().selectedProfileId === profileId
        commit(
          deleteProfile(get().stored, profileId),
          wasSelected ? { selectedProfileId: DEMO_IDS[0] } : {},
        )
      },

      resetDemoData: () => commit(resetDemoData(get().stored, DEMO_IDS)),
      updateSettings: (changes) => commit(updateSettings(get().stored, changes)),
      setToday: (date) => set({ today: date }),
    }
  })
}

export type AppStore = ReturnType<typeof createAppStore>
