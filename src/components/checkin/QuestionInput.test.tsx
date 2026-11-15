import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { type Answers, type Question, questionText } from '../../lib/triggers'
import PairStepper from './PairStepper'
import QuestionInput from './QuestionInput'

const indicatorQ = (id: string): Question => ({ kind: 'indicator', key: id, indicatorId: id })

/** Renders a question with real state, so typing and tapping behave as in the app */
function Harness({
  question,
  initial,
  onAnswered = () => {},
  onValue = () => {},
}: {
  question: Question
  initial?: Answers[string]
  onAnswered?: () => void
  onValue?: (v: Answers[string]) => void
}) {
  const [value, setValue] = useState<Answers[string]>(initial)
  return (
    <QuestionInput
      question={question}
      value={value}
      onChange={(v) => {
        setValue(v)
        onValue(v)
      }}
      onAnswered={onAnswered}
      hint="yesterday: 36.6"
    />
  )
}

describe('questionText', () => {
  it('uses the indicator or countermeasure question, or the check-in wording', () => {
    expect(questionText(indicatorQ('bodyTemperature'))).toBe("What's your body temperature?")
    expect(questionText({ kind: 'symptomGate', key: 'symptoms' })).toBe('Any symptoms today?')
    expect(
      questionText({ kind: 'countermeasure', key: 'cm:thighCuffs', questionId: 'thighCuffs' }),
    ).toBe('Did you wear thigh cuffs today?')
  })
})

describe('NumberStepper (via QuestionInput)', () => {
  it('steps by the indicator’s step size and shows the hint', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<Harness question={indicatorQ('bodyTemperature')} initial={36.6} onValue={onValue} />)
    expect(screen.getByRole('textbox', { name: 'Body temperature' })).toHaveValue('36.6')
    expect(screen.getByText('yesterday: 36.6')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Increase Body temperature' }))
    expect(onValue).toHaveBeenLastCalledWith(36.7)
    expect(screen.getByRole('textbox', { name: 'Body temperature' })).toHaveValue('36.7')
    await user.click(screen.getByRole('button', { name: 'Decrease Body temperature' }))
    await user.click(screen.getByRole('button', { name: 'Decrease Body temperature' }))
    expect(onValue).toHaveBeenLastCalledWith(36.5)
  })

  it('accepts typing, including an unfinished decimal', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<Harness question={indicatorQ('bodyTemperature')} onValue={onValue} />)
    const box = screen.getByRole('textbox', { name: 'Body temperature' })
    await user.type(box, '38.')
    expect(box).toHaveValue('38.') // kept while typing
    await user.type(box, '2')
    expect(onValue).toHaveBeenLastCalledWith(38.2)
    await user.clear(box)
    expect(onValue).toHaveBeenLastCalledWith(undefined)
  })

  it('moves exercise minutes in steps of 5', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<Harness question={indicatorQ('exerciseMinutes')} initial={90} onValue={onValue} />)
    await user.click(screen.getByRole('button', { name: 'Increase Exercise completed' }))
    expect(onValue).toHaveBeenLastCalledWith(95)
  })
})

describe('PairStepper', () => {
  it('only reports blood pressure when both numbers are set', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<Harness question={indicatorQ('bloodPressure')} onValue={onValue} />)
    await user.type(screen.getByRole('textbox', { name: 'Top (systolic)' }), '120')
    expect(onValue).toHaveBeenLastCalledWith(undefined)
    await user.type(screen.getByRole('textbox', { name: 'Bottom (diastolic)' }), '78')
    expect(onValue).toHaveBeenLastCalledWith([120, 78])
    // Both numbers stay visible
    expect(screen.getByRole('textbox', { name: 'Top (systolic)' })).toHaveValue('120')
  })

  it('shows a new pair set from outside, e.g. "Same as yesterday"', () => {
    const { rerender } = render(
      <PairStepper labels={['Top', 'Bottom']} value={undefined} onChange={() => {}} />,
    )
    rerender(<PairStepper labels={['Top', 'Bottom']} value={[118, 76]} onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Top' })).toHaveValue('118')
    expect(screen.getByRole('textbox', { name: 'Bottom' })).toHaveValue('76')
  })
})

describe('one-tap answers move on', () => {
  it('rating: words with faces; tapping answers and moves on', async () => {
    const user = userEvent.setup()
    const onAnswered = vi.fn()
    const onValue = vi.fn()
    render(<Harness question={indicatorQ('mood')} onAnswered={onAnswered} onValue={onValue} />)
    const good = screen.getByRole('button', { name: /Good/ })
    expect(good).toHaveTextContent('🙂')
    await user.click(good)
    expect(onValue).toHaveBeenLastCalledWith(4)
    expect(onAnswered).toHaveBeenCalledTimes(1)
    expect(good).toHaveAttribute('aria-pressed', 'true')
  })

  it('uses custom scale words (reversed stress scale, no faces)', () => {
    render(<Harness question={indicatorQ('stress')} />)
    expect(screen.getByRole('button', { name: 'Overwhelmed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Calm' })).not.toHaveTextContent('😞')
  })

  it('severity 0–3 starts at None', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<Harness question={indicatorQ('headache')} onValue={onValue} />)
    await user.click(screen.getByRole('button', { name: 'None' }))
    expect(onValue).toHaveBeenLastCalledWith(0)
  })

  it('yes/no, the symptom gate and countermeasure answers', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    const { unmount } = render(
      <Harness question={{ kind: 'symptomGate', key: 'symptoms' }} onValue={onValue} />,
    )
    await user.click(screen.getByRole('button', { name: 'Yes' }))
    expect(onValue).toHaveBeenLastCalledWith(true)
    unmount()
    render(
      <Harness
        question={{ kind: 'countermeasure', key: 'cm:thighCuffs', questionId: 'thighCuffs' }}
        onValue={onValue}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Yes, 3 h or more' }))
    expect(onValue).toHaveBeenLastCalledWith('Yes, 3 h or more')
  })
})

describe('Checklist', () => {
  it('toggles options and clears them with "None of these"', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<Harness question={indicatorQ('immuneSymptoms')} onValue={onValue} />)
    await user.click(screen.getByRole('button', { name: 'Cold sore' }))
    await user.click(screen.getByRole('button', { name: 'Cough' }))
    expect(onValue).toHaveBeenLastCalledWith(['coldSore', 'cough'])
    await user.click(screen.getByRole('button', { name: 'Cold sore' }))
    expect(onValue).toHaveBeenLastCalledWith(['cough'])
    await user.click(screen.getByRole('button', { name: 'None of these' }))
    expect(onValue).toHaveBeenLastCalledWith([])
  })

  it('shows the symptom tap list', () => {
    render(<Harness question={{ kind: 'symptomList', key: 'symptomList' }} />)
    expect(screen.getByRole('button', { name: 'Headache' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Poor appetite' })).toBeInTheDocument()
  })
})

describe('NoteInput', () => {
  it('takes free text with a length counter', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    render(<Harness question={{ kind: 'note', key: 'note' }} onValue={onValue} />)
    await user.type(screen.getByRole('textbox', { name: /Anything else to note/ }), 'Felt fine')
    expect(onValue).toHaveBeenLastCalledWith('Felt fine')
    expect(screen.getByText('9/500')).toBeInTheDocument()
  })
})
