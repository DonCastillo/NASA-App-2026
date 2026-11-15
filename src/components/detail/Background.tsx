import { ExternalLink } from 'lucide-react'
import type { ReactNode } from 'react'
import { systemSources } from '../../lib/sources'
import type { SystemDef } from '../../types'
import MeasureSteps from '../MeasureSteps'

// Background in System detail (plan/site-map.md → System detail §5–7, plan/tasks.md 4.5):
// collapsed by default, so a quick check fits on one screen. Native <details> elements are
// keyboard and screen-reader friendly without extra code.

function Collapsible({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-b border-space-700">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-medium text-text hover:bg-space-800 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden
          className="text-text-muted transition-transform duration-150 group-open:rotate-90"
        >
          ▸
        </span>
        {title}
      </summary>
      <div className="px-5 pb-4">{children}</div>
    </details>
  )
}

export default function Background({ system }: { system: SystemDef }) {
  const sources = systemSources(system)
  return (
    <div>
      <Collapsible title="Why this changes in space">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-text-muted marker:text-text-muted">
          {system.whyInSpace.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Collapsible>

      <Collapsible title="How to measure">
        <div className="flex flex-col gap-4">
          {system.indicators.map((indicator) => (
            <div key={indicator.id}>
              <h4 className="mb-1 text-sm font-semibold text-text">{indicator.name}</h4>
              <MeasureSteps indicator={indicator} />
            </div>
          ))}
        </div>
      </Collapsible>

      <Collapsible title={`Sources (${sources.length})`}>
        <ul className="flex flex-col gap-2 text-sm">
          {sources.map((source) => (
            <li key={source.slug} className="flex items-start gap-2">
              <span className="mt-0.5 w-9 shrink-0 text-[11px] font-semibold tracking-wide text-text-muted">
                {source.agency}
              </span>
              {source.url ? (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline-offset-2 hover:underline"
                >
                  {source.title}
                  <ExternalLink
                    size={12}
                    strokeWidth={1.5}
                    className="ml-1 inline align-baseline"
                    aria-label="(opens in a new tab)"
                  />
                </a>
              ) : (
                <span className="text-text">{source.title}</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-text-muted">
          Thresholds are illustrative demo values, not medical advice.
        </p>
      </Collapsible>
    </div>
  )
}
