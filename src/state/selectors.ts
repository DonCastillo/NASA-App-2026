import { format } from 'date-fns'
import { DEMO_CREW } from '../data/demoCrew'
import { MISSIONS } from '../data/missions'
import { SYSTEMS } from '../data/systems'
import { type Dataset, type Health, computeHealth } from '../lib/health'
import { demoProfile, generateDemoData } from '../lib/seed'
import { mergeDataset } from '../lib/storage'
import type { MissionProfile, MissionProfileId, Profile } from '../types'
import type { AppState } from './appStore'

// Read helpers for the store. Memoized: they return the same object until their inputs change,
// so screens don't regenerate 150 days of demo history (or re-render) on every update.

/** Remember the last result for the last inputs (compared with ===) */
function memoizeLast<Args extends unknown[], Result>(compute: (...args: Args) => Result) {
  let lastArgs: Args | undefined
  let lastResult: Result
  return (...args: Args): Result => {
    if (lastArgs && args.length === lastArgs.length && args.every((a, i) => a === lastArgs![i])) {
      return lastResult
    }
    lastArgs = args
    lastResult = compute(...args)
    return lastResult
  }
}

const dayKey = (date: Date) => format(date, 'yyyy-MM-dd')

// Demo histories are pure and expensive: cache them per crew member, mission and day
const demoCache = new Map<string, ReturnType<typeof generateDemoData>>()
function cachedDemo(crewId: string, missionId: MissionProfileId, today: Date) {
  const key = `${crewId}:${missionId}:${dayKey(today)}`
  let data = demoCache.get(key)
  if (!data) {
    data = generateDemoData(
      DEMO_CREW.find((c) => c.id === crewId)!,
      missionId,
      today,
    )
    demoCache.set(key, data)
  }
  return data
}

const profilesFor = memoizeLast(
  (userProfiles: Profile[], missionId: MissionProfileId, day: string): Profile[] => [
    ...DEMO_CREW.map((crew) => demoProfile(crew, missionId, new Date(`${day}T12:00`))),
    ...userProfiles,
  ],
)

/** Demo crew (on the selected mission) followed by the user's own profiles, for the Crew ▾ menu */
export const selectProfiles = (state: AppState): Profile[] =>
  profilesFor(state.stored.profiles, state.selectedMissionId, dayKey(state.today))

const datasetFor = memoizeLast(
  (
    stored: AppState['stored'],
    profileId: string,
    missionId: MissionProfileId,
    _day: string, // part of the memo key only: recompute once per day
    today: Date,
  ): Dataset => {
    const userProfile = stored.profiles.find((p) => p.id === profileId)
    if (userProfile) return mergeDataset(userProfile, stored)
    const demo = cachedDemo(profileId, missionId, today)
    return mergeDataset(demo.profile, stored, demo)
  },
)

/** The selected crew member's full data: generated demo history (if demo) plus saved additions */
export const selectDataset = (state: AppState): Dataset =>
  datasetFor(
    state.stored,
    state.selectedProfileId,
    state.selectedMissionId,
    dayKey(state.today),
    state.today,
  )

/** The selected crew member's mission profile (demo: the selected mission; user: their own) */
export const selectMission = (state: AppState): MissionProfile =>
  MISSIONS[selectDataset(state).profile.mission.profileId]

const healthFor = memoizeLast(
  (dataset: Dataset, mission: MissionProfile, _day: string, today: Date): Health =>
    computeHealth(dataset, mission, today),
)

/** Statuses, readiness, latest values, mission day, comms delay, dose and projections */
export const selectHealth = (state: AppState): Health =>
  healthFor(selectDataset(state), selectMission(state), dayKey(state.today), state.today)

/** The draft check-in for the selected profile, if one was left unfinished */
export const selectDraft = (state: AppState) => state.stored.drafts[state.selectedProfileId]

/** Systems in display order with their health, for the system list */
export const selectSystemList = (state: AppState) => {
  const health = selectHealth(state)
  return SYSTEMS.map((system) => ({ system, health: health.systems[system.id] }))
}
