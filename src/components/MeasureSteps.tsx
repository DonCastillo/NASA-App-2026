import type { Indicator } from '../types'

// "How to measure" steps for one indicator, from src/data/systems/*.ts.
// Used in System detail (4.5) and in the "How do I measure this?" overlay during check-in (5.5).
export default function MeasureSteps({ indicator }: { indicator: Indicator }) {
  return (
    <ol className="list-decimal space-y-1 pl-5 text-sm text-text marker:text-text-muted">
      {indicator.howToMeasure.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  )
}
