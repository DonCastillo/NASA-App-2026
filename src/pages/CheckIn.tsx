import { ArrowLeft, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import CheckInSummary from '../components/checkin/CheckInSummary'
import QuestionInput from '../components/checkin/QuestionInput'
import MeasureOverlay from '../components/MeasureOverlay'
import { SYSTEMS } from '../data/systems'
import {
  checkInTitle,
  lastValue,
  lastValueHint,
  modeFromSearch,
  plausibilityWarning,
  sameMode,
} from '../lib/checkInFlow'
import {
  type Answers,
  type CheckInContext,
  buildCheckIn,
  buildQuestions,
  questionText,
} from '../lib/triggers'
import { selectDataset, selectDraft, selectHealth, selectMission } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'
import type { Health } from '../lib/health'
import FirstTimeHint from '../components/onboarding/FirstTimeHint'
import type { CheckInDraft, ReadingValue } from '../types'

// The check-in page (plan/site-map.md → Check-in, plan/tasks.md 5.3).
// Routes: /check-in (daily), /check-in?system=eyes, /check-in?task=recheck-bodyTemperature
// One question per screen. The question list comes from the engine (src/lib/triggers.ts) and is
// rebuilt after every answer, so follow-ups appear as soon as they apply.
// Every change is saved as a draft, so a check-in can be left and resumed.

const ALL_INDICATORS = SYSTEMS.flatMap((s) => s.indicators)

export default function CheckIn() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const mode = useMemo(() => modeFromSearch(params), [params])

  const dataset = useAppStore(selectDataset)
  const health = useAppStore(selectHealth)
  const mission = useAppStore(selectMission)
  const now = useAppStore((s) => s.now)
  const savedDraft = useAppStore(selectDraft)
  const saveDraft = useAppStore((s) => s.saveDraft)
  const clearDraft = useAppStore((s) => s.clearDraft)
  const addCheckIn = useAppStore((s) => s.addCheckIn)

  // Resume an unfinished check-in of the same kind, or start a new one
  const [draft, setDraft] = useState<CheckInDraft>(() =>
    savedDraft && sameMode(savedDraft.mode, mode)
      ? savedDraft
      : {
          id: crypto.randomUUID(),
          profileId: dataset.profile.id,
          mode,
          startedAt: now().toISOString(),
          answers: {},
          index: 0,
        },
  )
  const [resumed] = useState(
    () => !!savedDraft && sameMode(savedDraft.mode, mode) && savedDraft.index > 0,
  )
  const [warning, setWarning] = useState<string>()
  const [showMeasure, setShowMeasure] = useState(false)
  // Set on Finish: the health picture before saving, to show what changed
  const [done, setDone] = useState<{ before: Health; durationMs: number }>()

  const ctx: CheckInContext = {
    mode,
    profile: dataset.profile,
    mission,
    now: now(),
    references: health.references,
    checkIns: dataset.checkIns,
    events: dataset.events,
  }
  const questions = buildQuestions(ctx, draft.answers)
  const index = Math.min(draft.index, questions.length - 1)
  const question = questions[index]
  const indicator =
    question.kind === 'indicator'
      ? ALL_INDICATORS.find((i) => i.id === question.indicatorId)
      : undefined
  const last = indicator ? lastValue(indicator.id, dataset.checkIns) : undefined

  // Numbers start at the last value, so an unchanged reading is one tap on Next
  const prefill =
    indicator && (indicator.input === 'number' || indicator.input === 'numberPair')
      ? last?.value
      : undefined
  const shown: Answers[string] = draft.answers[question.key] ?? prefill
  const isLast = index === questions.length - 1

  /** Save answers and position (also as a draft in storage) */
  const update = (answers: Answers, nextIndex: number) => {
    const next = { ...draft, answers, index: nextIndex }
    setDraft(next)
    setWarning(undefined)
    setShowMeasure(false)
    saveDraft(next)
  }

  const finish = (answers: Answers) => {
    const finalCtx = { ...ctx, now: now() }
    const finalQuestions = buildQuestions(finalCtx, answers)
    const before = health
    addCheckIn(buildCheckIn(finalCtx, finalQuestions, answers, draft.id, draft.startedAt))
    setDone({ before, durationMs: finalCtx.now.getTime() - new Date(draft.startedAt).getTime() })
  }

  /** Move on with this answer (or finish after the last question) */
  const advance = (value: Answers[string]) => {
    const answers = { ...draft.answers, [question.key]: value }
    if (isLast) finish(answers)
    else update(answers, index + 1)
  }

  const onNext = () => {
    if (indicator && warning === undefined) {
      const problem = plausibilityWarning(indicator, shown as ReadingValue)
      if (problem) {
        setWarning(problem)
        return
      }
    }
    advance(shown ?? (question.kind === 'symptomList' ? [] : undefined))
  }

  const canGoNext =
    shown !== undefined ||
    question.kind === 'note' ||
    question.kind === 'symptomList' ||
    indicator?.input === 'checklist'

  if (done) {
    // `health` is now the picture after saving the check-in
    return <CheckInSummary before={done.before} after={health} durationMs={done.durationMs} />
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-5 p-4 md:p-8">
      {/* Top bar: title (centered), progress, close. Back sits next to Next below. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[13px] text-text-muted">
        <span aria-hidden />
        <h1 className="text-center text-sm font-semibold text-text">{checkInTitle(mode)}</h1>
        <div className="flex items-center justify-end gap-2">
          <span className="reading" aria-live="polite">
            {index + 1} of {questions.length}
          </span>
          <button
            type="button"
            aria-label="Close check-in (your answers are kept)"
            onClick={() => navigate('/')}
            className="grid size-9 place-items-center rounded-control hover:text-text"
          >
            <X size={18} strokeWidth={1.5} aria-hidden />
          </button>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Check-in progress"
        aria-valuemin={1}
        aria-valuemax={questions.length}
        aria-valuenow={index + 1}
        className="h-1.5 overflow-hidden rounded-full bg-space-700"
      >
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-250"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <FirstTimeHint id="checkIn" />

      {resumed && index === draft.index && draft.index > 0 && (
        <p className="rounded-control bg-space-800 px-3 py-2 text-[13px] text-text-muted">
          Resumed your unfinished check-in.{' '}
          <button
            type="button"
            className="font-medium text-accent underline-offset-2 hover:underline"
            onClick={() => {
              clearDraft(draft.profileId)
              setDraft({
                ...draft,
                id: crypto.randomUUID(),
                answers: {},
                index: 0,
                startedAt: now().toISOString(),
              })
            }}
          >
            Start over
          </button>
        </p>
      )}

      {/* The question */}
      <div className="flex flex-col gap-2 pt-2">
        <h2 className="text-xl font-semibold text-text">{questionText(question)}</h2>
        {question.kind === 'indicator' && question.reason && (
          <p className="text-[13px] text-text-muted">{question.reason}</p>
        )}
      </div>

      <QuestionInput
        key={question.key}
        question={question}
        value={shown}
        onChange={(value) => update({ ...draft.answers, [question.key]: value }, index)}
        onAnswered={(value) => advance(value)}
        hint={
          indicator && last && prefill !== undefined
            ? lastValueHint(indicator, last, now())
            : undefined
        }
      />

      {warning && (
        <div
          role="alert"
          className="flex flex-col gap-2 rounded-control border border-warn/50 bg-warn/8 px-3.5 py-3 text-sm"
        >
          <p className="text-text">{warning}</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setWarning(undefined)}
              className="h-9 rounded-control border border-space-700 px-3 font-medium text-text hover:bg-space-800"
            >
              Check again
            </button>
            <button
              type="button"
              onClick={() => advance(shown)}
              className="h-9 rounded-control border border-space-700 px-3 font-medium text-text hover:bg-space-800"
            >
              It’s correct
            </button>
          </div>
        </div>
      )}

      {indicator && (
        <div>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setShowMeasure(true)}
            className="text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            How do I measure this?
          </button>
          {showMeasure && (
            <MeasureOverlay indicator={indicator} onClose={() => setShowMeasure(false)} />
          )}
        </div>
      )}

      {/* Actions: "Same as yesterday" (centered) above Back · Next, then Skip */}
      <div className="mt-2 flex flex-col gap-2">
        {last && question.kind === 'indicator' && (
          <button
            type="button"
            onClick={() => advance(last.value)}
            className="h-10 self-center rounded-control border border-space-700 px-5 text-sm font-semibold text-text hover:bg-space-800"
          >
            Same as yesterday
          </button>
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => update(draft.answers, index - 1)}
            disabled={index === 0}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-control border border-space-700 px-4 font-semibold text-text hover:bg-space-800 disabled:opacity-45 disabled:hover:bg-transparent"
          >
            <ArrowLeft size={18} strokeWidth={1.5} aria-hidden /> Back
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext || warning !== undefined}
            className="h-11 flex-1 rounded-control bg-accent px-4 font-semibold text-space-950 hover:bg-accent-hover disabled:opacity-45"
          >
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
        {question.kind !== 'note' && (
          <button
            type="button"
            onClick={() => advance(null)}
            className="h-9 self-center rounded-control px-3 text-sm text-text-muted hover:text-text"
          >
            Skip
          </button>
        )}
      </div>
    </section>
  )
}
