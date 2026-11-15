import { format } from 'date-fns'
import { useId, useState } from 'react'
import { COUNTERMEASURES } from '../data/countermeasures'
import { EVENT_TYPES } from '../data/events'
import { SYSTEMS } from '../data/systems'
import { selectDataset, selectMission } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'
import type { MissionEvent, MissionEventType } from '../types'
import Modal from './Modal'

// Overlay B — Log event (plan/site-map.md → Overlays, plan/tasks.md 5.6): event type, time
// (default now; a future time logs an upcoming landing), optional note. The check-in engine reads
// events, so the next check-in asks the matching follow-ups (and pre-landing questions before a landing).

const ALL_INDICATORS = SYSTEMS.flatMap((s) => s.indicators)
const toInputValue = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm")

export default function LogEventOverlay({ onClose }: { onClose: () => void }) {
  const dataset = useAppStore(selectDataset)
  const mission = useAppStore(selectMission)
  const now = useAppStore((s) => s.now)
  const addEvent = useAppStore((s) => s.addEvent)

  const [type, setType] = useState<MissionEventType>('spacewalk')
  const [at, setAt] = useState(() => toInputValue(now()))
  const [note, setNote] = useState('')
  const [saved, setSaved] = useState<MissionEvent>()
  const whenHintId = useId()

  const save = () => {
    const event: MissionEvent = {
      id: crypto.randomUUID(),
      profileId: dataset.profile.id,
      missionId: mission.id,
      type,
      at: new Date(at).toISOString(),
      note: note.trim() || undefined,
    }
    addEvent(event)
    setSaved(event)
  }

  if (saved) {
    const def = EVENT_TYPES.find((e) => e.id === saved.type)!
    const upcoming = new Date(saved.at) > now()
    const followUps = def.followUpIndicators
      .filter((id) => id !== 'balanceTest' || mission.id === 'artemis')
      .map((id) => ALL_INDICATORS.find((i) => i.id === id)!.name.toLowerCase())
    const before = def.beforeEventQuestions.map(
      (id) => COUNTERMEASURES.find((q) => q.id === id)!.question,
    )
    return (
      <Modal eyebrow="Log event" title={`${def.label} logged`} onClose={onClose}>
        <div className="flex flex-col gap-3 text-sm">
          <p className="text-text-muted">
            {format(new Date(saved.at), 'EEE d MMM, HH:mm')}
            {saved.note && ` · ${saved.note}`}
          </p>
          {upcoming && before.length > 0 ? (
            <p className="text-text">Before it, your check-in will ask: {before.join(' ')}</p>
          ) : (
            <p className="text-text">Your next check-in will ask about {followUps.join(', ')}.</p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-1 h-11 rounded-control bg-accent font-semibold text-space-950 hover:bg-accent-hover"
          >
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal eyebrow="Log event" title="What happened?" onClose={onClose}>
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <fieldset className="flex flex-col gap-2">
          <legend className="sr-only">Event type</legend>
          {EVENT_TYPES.map((event) => (
            <label
              key={event.id}
              className={`flex cursor-pointer gap-3 rounded-control border px-3 py-2.5 text-sm ${
                type === event.id ? 'border-accent bg-accent/12' : 'border-space-700 bg-space-800'
              }`}
            >
              <input
                type="radio"
                name="event-type"
                value={event.id}
                checked={type === event.id}
                onChange={() => setType(event.id)}
                className="mt-1 accent-[var(--color-accent)]"
              />
              <span>
                <span className="block font-medium text-text">{event.label}</span>
                <span className="block text-text-muted">{event.description}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="flex flex-col gap-1.5 text-sm">
          <label className="flex flex-col gap-1.5">
            <span className="font-medium text-text">When</span>
            <input
              type="datetime-local"
              value={at}
              onChange={(e) => setAt(e.target.value)}
              required
              aria-describedby={whenHintId}
              className="reading h-11 rounded-control border border-space-700 bg-space-800 px-3 text-text"
            />
          </label>
          <span id={whenHintId} className="text-xs text-text-muted">
            Use a future time to log an upcoming landing.
          </span>
        </div>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-text">Note (optional)</span>
          <input
            type="text"
            value={note}
            maxLength={200}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Antenna repair"
            className="h-11 rounded-control border border-space-700 bg-space-800 px-3 text-text placeholder:text-text-muted"
          />
        </label>

        <button
          type="submit"
          className="h-11 rounded-control bg-accent font-semibold text-space-950 hover:bg-accent-hover"
        >
          Log event
        </button>
      </form>
    </Modal>
  )
}
