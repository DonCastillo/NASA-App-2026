import { COUNTERMEASURES } from '../../data/countermeasures'
import { RATING_LABELS, SEVERITY_LABELS } from '../../data/scales'
import { SYMPTOM_OPTIONS } from '../../data/symptoms'
import { SYSTEMS } from '../../data/systems'
import { type Answers, type Question, questionText } from '../../lib/triggers'
import type { Indicator, ReadingValue } from '../../types'
import ChoiceButtons, { type Choice } from './ChoiceButtons'
import Checklist from './Checklist'
import NoteInput from './NoteInput'
import NumberStepper from './NumberStepper'
import PairStepper from './PairStepper'

// Picks the right input for a question from the check-in engine (src/lib/triggers.ts).
// `onChange` updates the answer; `onAnswered` is called by one-tap inputs to move on.

/** Faces for the default 1–5 rating (mood, sleep quality, appetite, crew relations) */
const FACES = ['😞', '🙁', '😐', '🙂', '😄']

const ALL_INDICATORS = SYSTEMS.flatMap((system) => system.indicators)

function scaleChoices(indicator: Indicator): Choice<number>[] {
  if (indicator.input === 'rating') {
    const labels = indicator.scaleLabels ?? RATING_LABELS
    return labels.map((label, i) => ({
      value: i + 1,
      label,
      face: indicator.scaleLabels ? undefined : FACES[i],
    }))
  }
  return (indicator.scaleLabels ?? SEVERITY_LABELS).map((label, i) => ({ value: i, label }))
}

type Props = {
  question: Question
  value: Answers[string]
  onChange: (value: Answers[string]) => void
  onAnswered: () => void
  /** e.g. "yesterday: 36.6" under number inputs */
  hint?: string
}

export default function QuestionInput({ question, value, onChange, onAnswered, hint }: Props) {
  const label = questionText(question)
  const answer = (v: Answers[string]) => {
    onChange(v)
    onAnswered()
  }

  switch (question.kind) {
    case 'symptomGate':
      return (
        <ChoiceButtons
          label={label}
          value={typeof value === 'boolean' ? value : undefined}
          choices={[
            { value: false, label: 'No' },
            { value: true, label: 'Yes' },
          ]}
          onAnswer={answer}
        />
      )
    case 'symptomList':
      return (
        <Checklist
          label={label}
          options={SYMPTOM_OPTIONS}
          value={Array.isArray(value) ? (value as string[]) : undefined}
          onChange={onChange}
        />
      )
    case 'countermeasure': {
      const q = COUNTERMEASURES.find((c) => c.id === question.questionId)!
      return (
        <ChoiceButtons
          label={label}
          value={typeof value === 'string' ? value : undefined}
          choices={q.answers.map((a) => ({ value: a, label: a }))}
          columns={q.answers.length > 3 ? 2 : undefined}
          onAnswer={answer}
        />
      )
    }
    case 'note':
      return (
        <NoteInput
          label={label}
          value={typeof value === 'string' ? value : undefined}
          onChange={onChange}
        />
      )
    case 'indicator': {
      const indicator = ALL_INDICATORS.find((i) => i.id === question.indicatorId)!
      return <IndicatorInput indicator={indicator} {...{ value, onChange, answer, label, hint }} />
    }
  }
}

function IndicatorInput({
  indicator,
  value,
  onChange,
  answer,
  label,
  hint,
}: {
  indicator: Indicator
  value: Answers[string]
  onChange: (value: ReadingValue | undefined) => void
  answer: (value: ReadingValue) => void
  label: string
  hint?: string
}) {
  switch (indicator.input) {
    case 'number':
      return (
        <NumberStepper
          label={indicator.name}
          value={typeof value === 'number' ? value : undefined}
          onChange={onChange}
          step={indicator.step}
          unit={indicator.unit}
          hint={hint}
        />
      )
    case 'numberPair':
      return (
        <PairStepper
          labels={['Top (systolic)', 'Bottom (diastolic)']}
          value={
            Array.isArray(value) && typeof value[0] === 'number'
              ? (value as [number, number])
              : undefined
          }
          onChange={onChange}
          unit={indicator.unit}
          hint={hint}
        />
      )
    case 'severity':
    case 'rating': {
      const choices = scaleChoices(indicator)
      return (
        <ChoiceButtons
          label={label}
          value={typeof value === 'number' ? value : undefined}
          choices={choices}
          columns={choices.length > 4 ? 5 : choices.length}
          onAnswer={answer}
        />
      )
    }
    case 'yesNo':
      return (
        <ChoiceButtons
          label={label}
          value={typeof value === 'boolean' ? value : undefined}
          choices={[
            { value: false, label: 'No' },
            { value: true, label: 'Yes' },
          ]}
          onAnswer={answer}
        />
      )
    case 'checklist':
      return (
        <Checklist
          label={label}
          options={indicator.options ?? []}
          value={Array.isArray(value) ? (value as string[]) : undefined}
          onChange={onChange}
        />
      )
    case 'calculated':
      return null
  }
}
