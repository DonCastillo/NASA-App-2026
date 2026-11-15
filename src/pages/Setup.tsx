import { type ReactNode, useId, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { MISSION_LIST } from '../data/missions'
import { SUPPLEMENTS } from '../data/supplements'
import {
  BASELINE_FIELDS,
  type SetupForm,
  emptyForm,
  formFromProfile,
  formProblems,
  profileFromForm,
  withMission,
} from '../lib/setupForm'
import { selectDataset } from '../state/selectors'
import { useAppStore } from '../state/useAppStore'
import type { Sex } from '../types'

// Crew & mission setup (plan/site-map.md → Setup, plan/tasks.md 5.7). Route: /setup
//   /setup?new=1 → add a crew member · /setup → edit the selected (own) profile
// Three short steps, each skippable; only a display name is required to finish.

const STEPS = ['Profile', 'Preflight baselines', 'Mission'] as const

const inputClass =
  'h-11 w-full rounded-control border border-space-700 bg-space-800 px-3 text-[15px] text-text outline-none placeholder:text-text-muted focus:border-accent'

/** A labelled field; the hint is shown below and linked as the input's description */
function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: (describedBy: string | undefined) => ReactNode
}) {
  const hintId = useId()
  return (
    <div className="flex flex-col gap-1.5 text-sm">
      <label className="flex flex-col gap-1.5">
        <span className="font-medium text-text">{label}</span>
        {children(hint ? hintId : undefined)}
      </label>
      {hint && (
        <span id={hintId} className="text-xs text-text-muted">
          {hint}
        </span>
      )}
    </div>
  )
}

function NumberField({
  label,
  unit,
  value,
  onChange,
  placeholder,
}: {
  label: string
  unit?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <Field label={unit ? `${label} (${unit})` : label}>
      {() => (
        <input
          type="text"
          inputMode="decimal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          className={`${inputClass} reading`}
        />
      )}
    </Field>
  )
}

export default function Setup() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const isNew = params.get('new') === '1'
  const now = useAppStore((s) => s.now)
  const current = useAppStore(selectDataset).profile
  const saveProfile = useAppStore((s) => s.saveProfile)
  const selectProfile = useAppStore((s) => s.selectProfile)
  const deleteProfile = useAppStore((s) => s.deleteProfile)

  const editing = !isNew && !current.isDemo
  const [form, setForm] = useState<SetupForm>(() =>
    editing ? formFromProfile(current) : emptyForm(now()),
  )
  const [step, setStep] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tried, setTried] = useState(false)

  // Demo crew profiles are generated, not stored, so they can't be edited
  if (!isNew && current.isDemo) {
    return (
      <section className="mx-auto flex max-w-xl flex-col gap-4 p-4 md:p-8">
        <h1 className="text-2xl font-semibold">Crew & mission setup</h1>
        <p className="text-sm text-text-muted">
          {current.name} is part of the demo crew. Demo profiles can’t be edited, but you can add
          your own crew member.
        </p>
        <Link
          to="/setup?new=1"
          className="flex h-11 items-center justify-center rounded-control bg-accent font-semibold text-space-950 hover:bg-accent-hover"
        >
          Add crew member
        </Link>
      </section>
    )
  }

  const set = (changes: Partial<SetupForm>) => setForm((f) => ({ ...f, ...changes }))
  const problems = formProblems(form)

  const finish = () => {
    setTried(true)
    if (problems.length) return
    const profile = profileFromForm(form, editing ? current.id : crypto.randomUUID())
    saveProfile(profile)
    selectProfile(profile.id)
    navigate('/')
  }

  return (
    <section className="mx-auto flex max-w-xl flex-col gap-5 p-4 md:p-8">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="text-2xl font-semibold">
          {editing ? `Edit ${current.name}` : 'Add crew member'}
        </h1>
        <span className="reading text-sm text-text-muted">
          Step {step + 1} of {STEPS.length}
        </span>
      </div>
      <nav aria-label="Setup steps" className="flex gap-2">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            aria-current={i === step ? 'step' : undefined}
            onClick={() => setStep(i)}
            className={`flex-1 rounded-control border px-2 py-2 text-[13px] font-medium ${
              i === step
                ? 'border-accent bg-accent/12 text-text'
                : 'border-space-700 text-text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Profile</h2>
          <Field
            label="Display name or call sign"
            hint="Shown in the crew menu. No legal name needed."
          >
            {(describedBy) => (
              <input
                type="text"
                aria-describedby={describedBy}
                value={form.name}
                maxLength={40}
                onChange={(e) => set({ name: e.target.value })}
                className={inputClass}
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Age" value={form.age} onChange={(age) => set({ age })} />
            <NumberField
              label="Height"
              unit="cm"
              value={form.heightCm}
              onChange={(heightCm) => set({ heightCm })}
            />
          </div>
          <fieldset className="flex flex-col gap-1.5 text-sm">
            <legend className="mb-1.5 font-medium text-text">Sex</legend>
            <div className="flex gap-2">
              {(['female', 'male'] as Sex[]).map((sex) => (
                <label
                  key={sex}
                  className={`flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-control border capitalize ${
                    form.sex === sex
                      ? 'border-accent bg-accent/12'
                      : 'border-space-700 bg-space-800'
                  }`}
                >
                  <input
                    type="radio"
                    name="sex"
                    checked={form.sex === sex}
                    onChange={() => set({ sex })}
                    className="accent-[var(--color-accent)]"
                  />
                  {sex}
                </label>
              ))}
            </div>
          </fieldset>
          <NumberField
            label="Preflight body mass"
            unit="kg"
            value={form.preflightBodyMassKg}
            onChange={(preflightBodyMassKg) => set({ preflightBodyMassKg })}
          />
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="mb-1.5 font-medium text-text">
              Regular supplements / medications
            </legend>
            {SUPPLEMENTS.map((item) => (
              <label key={item.id} className="flex items-center gap-2.5 text-text">
                <input
                  type="checkbox"
                  checked={form.supplements.includes(item.id)}
                  onChange={(e) =>
                    set({
                      supplements: e.target.checked
                        ? [...form.supplements, item.id]
                        : form.supplements.filter((id) => id !== item.id),
                    })
                  }
                  className="size-4 accent-[var(--color-accent)]"
                />
                {item.label}
              </label>
            ))}
          </fieldset>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Preflight baselines</h2>
          <p className="text-sm text-text-muted">
            Leave any field empty if you don’t know it: the app uses the average of your first 7
            days of check-ins instead.
          </p>
          {BASELINE_FIELDS.map((field) => (
            <div key={field.key} className="flex items-end gap-2">
              <div className="flex-1">
                <NumberField
                  label={field.label}
                  unit={field.unit}
                  value={form.baselines[field.key]}
                  placeholder="Don't know"
                  onChange={(value) =>
                    set({ baselines: { ...form.baselines, [field.key]: value } })
                  }
                />
              </div>
              {form.baselines[field.key] && (
                <button
                  type="button"
                  onClick={() => set({ baselines: { ...form.baselines, [field.key]: '' } })}
                  className="h-11 rounded-control px-2 text-xs text-text-muted hover:text-text"
                >
                  Don’t know
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Mission</h2>
          <fieldset className="flex flex-col gap-2 text-sm">
            <legend className="sr-only">Mission profile</legend>
            {MISSION_LIST.map((mission) => (
              <label
                key={mission.id}
                className={`flex cursor-pointer gap-3 rounded-control border px-3 py-2.5 ${
                  form.missionId === mission.id
                    ? 'border-accent bg-accent/12'
                    : 'border-space-700 bg-space-800'
                }`}
              >
                <input
                  type="radio"
                  name="mission"
                  checked={form.missionId === mission.id}
                  onChange={() => setForm((f) => withMission(f, mission.id))}
                  className="mt-1 accent-[var(--color-accent)]"
                />
                <span>
                  <span className="block font-medium text-text">{mission.name}</span>
                  <span className="block text-text-muted">{mission.lengthCovers}</span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Start date">
              {() => (
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set({ startDate: e.target.value })}
                  className={`${inputClass} reading`}
                />
              )}
            </Field>
            <NumberField
              label="Length"
              unit="days"
              value={form.lengthDays}
              onChange={(lengthDays) => set({ lengthDays })}
            />
          </div>
          <p className="text-xs text-text-muted">
            {MISSION_LIST.find((m) => m.id === form.missionId)!.lengthCovers} · default{' '}
            {MISSION_LIST.find((m) => m.id === form.missionId)!.defaultLengthDays} days
          </p>
        </div>
      )}

      {tried && problems.length > 0 && (
        <ul
          role="alert"
          className="list-disc rounded-control border border-alert/45 bg-alert/8 py-2.5 pr-3 pl-7 text-sm text-text"
        >
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      )}

      <div className="flex gap-2">
        {step < STEPS.length - 1 ? (
          <>
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="h-11 flex-1 rounded-control border border-space-700 font-semibold text-text hover:bg-space-800"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="h-11 flex-1 rounded-control bg-accent font-semibold text-space-950 hover:bg-accent-hover"
            >
              Next
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={finish}
            className="h-11 flex-1 rounded-control bg-accent font-semibold text-space-950 hover:bg-accent-hover"
          >
            {editing ? 'Save changes' : 'Finish'}
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-4 border-t border-space-700 pt-4">
          {confirmDelete ? (
            <div role="alert" className="flex flex-col gap-2 text-sm">
              <p className="text-text">
                Delete {current.name}’s profile and all check-ins? This can’t be undone.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    deleteProfile(current.id)
                    navigate('/')
                  }}
                  className="h-10 rounded-control border border-alert px-3 font-semibold text-alert-text hover:bg-alert/10"
                >
                  Delete profile
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="h-10 rounded-control border border-space-700 px-3 font-semibold text-text hover:bg-space-800"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="h-10 rounded-control border border-alert px-3 text-sm font-semibold text-alert-text hover:bg-alert/10"
            >
              Delete profile…
            </button>
          )}
        </div>
      )}
    </section>
  )
}
