import { useEffect, useMemo, useState } from 'react'
import { type ScheduleInput, pendingTasks, scheduleTasks } from '../lib/scheduler'
import { selectDataset, selectHealth, selectMission } from './selectors'
import { useAppStore } from './useAppStore'

// The selected crew member's routine right now (plan/tasks.md 6.1), shared by the 🔔 bell, the
// Routine page and the nav badges so they always agree. Tasks change with time (due → overdue),
// so this re-runs the scheduler once a minute, and whenever the data changes.

const MINUTE = 60_000

export function useTasks() {
  const dataset = useAppStore(selectDataset)
  const health = useAppStore(selectHealth)
  const mission = useAppStore(selectMission)
  const now = useAppStore((s) => s.now)

  const [tick, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), MINUTE)
    return () => clearInterval(id)
  }, [])

  return useMemo(() => {
    const input: ScheduleInput = {
      profile: dataset.profile,
      mission,
      checkIns: dataset.checkIns,
      events: dataset.events,
      health,
      now: now(),
    }
    const tasks = scheduleTasks(input)
    return { input, tasks, pending: pendingTasks(tasks) }
    // `tick` is a dependency only so the clock is read again every minute
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, mission, health, now, tick])
}
