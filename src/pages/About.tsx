import { ExternalLink, Info } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router'
import StatusChip from '../components/StatusChip'
import {
  ABOUT_INTRO,
  COMMS_DELAY_TEXT,
  DISCLAIMER,
  PROJECT_LINKS,
  SOURCE_TYPE_MEANING,
  STATUS_MEANING,
  TIER_MEANING,
} from '../data/about'
import { ARTICLES } from '../data/articles'
import { MISSION_LIST } from '../data/missions'
import { SYSTEMS } from '../data/systems'
import { formatDelay } from '../lib/format'
import { useAppStore } from '../state/useAppStore'
import type { ArticleRef, SourceType, Status } from '../types'

// How BodyMap works, its indicators and sources, and the disclaimer (plan/site-map.md → About,
// plan/tasks.md 7.1). Route: /about. Also replays the Welcome and the tour, and resets demo data.

const STATUSES: Status[] = ['green', 'amber', 'red', 'none']
const SOURCE_TYPES: SourceType[] = ['direct', 'proxy', 'added']
const ALL_INDICATORS = SYSTEMS.flatMap((s) => s.indicators)

/** Articles cited by any system or indicator, NASA first, then by title */
const CITED: ArticleRef[] = [
  ...new Set([...SYSTEMS.flatMap((s) => s.sources), ...ALL_INDICATORS.flatMap((i) => i.sources)]),
]
  .flatMap((slug) => (ARTICLES[slug] ? [ARTICLES[slug]] : []))
  .sort((a, b) => a.agency.localeCompare(b.agency) || a.title.localeCompare(b.title))

const delayText = (mission: (typeof MISSION_LIST)[number]) =>
  mission.commsDelay.kind === 'fixed'
    ? formatDelay(mission.commsDelay.seconds)
    : `up to ${formatDelay(mission.commsDelay.maxSeconds)}`

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  )
}

function SourceTag({ type }: { type: SourceType }) {
  return (
    <span className="shrink-0 rounded-full border border-space-700 px-2 text-[11px] leading-5 font-medium text-text-muted">
      {SOURCE_TYPE_MEANING[type].label}
    </span>
  )
}

const buttonClass =
  'h-11 rounded-control border border-space-700 px-4 text-sm font-semibold text-text hover:bg-space-800'

export default function About() {
  const navigate = useNavigate()
  const updateSettings = useAppStore((s) => s.updateSettings)
  const resetDemoData = useAppStore((s) => s.resetDemoData)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  const counts = SOURCE_TYPES.map(
    (type) => `${ALL_INDICATORS.filter((i) => i.sourceType === type).length} ${type}`,
  )

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 p-4 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">About</h1>
        <p className="text-[15px] text-text-muted">{ABOUT_INTRO}</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          {PROJECT_LINKS.map((link) => (
            <li key={link.url}>
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-accent underline-offset-2 hover:underline"
              >
                {link.label}
                <ExternalLink size={12} strokeWidth={1.5} aria-label="(opens in a new tab)" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <Section title="How BodyMap works">
        <h3 className="text-sm font-semibold text-text">Status</h3>
        <ul className="flex flex-col gap-2">
          {STATUSES.map((status) => (
            <li key={status} className="flex items-start gap-3 text-sm">
              <span className="w-32 shrink-0">
                <StatusChip status={status} />
              </span>
              <span className="pt-1 text-text-muted">{STATUS_MEANING[status]}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-2 text-sm font-semibold text-text">Check-ins</h3>
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[10rem_1fr]">
          {TIER_MEANING.map((tier) => (
            <div key={tier.tier} className="contents">
              <dt className="font-medium text-text">{tier.name}</dt>
              <dd className="text-text-muted">{tier.text}</dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-2 text-sm font-semibold text-text">Communication delay and guidance</h3>
        <p className="text-sm text-text-muted">{COMMS_DELAY_TEXT}</p>
        <div className="overflow-x-auto rounded-panel border border-space-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-space-900 text-xs text-text-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">
                  Mission
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  One-way delay
                </th>
                <th scope="col" className="px-3 py-2 font-semibold">
                  On a red status
                </th>
              </tr>
            </thead>
            <tbody>
              {MISSION_LIST.map((mission) => (
                <tr key={mission.id} className="border-t border-space-700 align-top">
                  <th scope="row" className="px-3 py-2 font-medium text-text">
                    {mission.name}
                  </th>
                  <td className="reading px-3 py-2 whitespace-nowrap text-text-muted">
                    {delayText(mission)}
                  </td>
                  <td className="px-3 py-2 text-text-muted">{mission.escalation.red}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title={`${SYSTEMS.length} body systems, ${ALL_INDICATORS.length} indicators`}>
        <p className="text-sm text-text-muted">
          Each indicator is marked by where it comes from ({counts.join(' · ')}):
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          {SOURCE_TYPES.map((type) => (
            <li key={type} className="flex items-center gap-2">
              <SourceTag type={type} />
              <span className="text-text-muted">{SOURCE_TYPE_MEANING[type].text}</span>
            </li>
          ))}
        </ul>
        <div className="grid gap-3 sm:grid-cols-2">
          {SYSTEMS.map((system) => (
            <div
              key={system.id}
              className="rounded-panel border border-space-700 bg-space-900 px-4 py-3"
            >
              <h3 className="text-sm font-semibold text-text">{system.name}</h3>
              <ul className="mt-2 flex flex-col gap-1.5">
                {system.indicators.map((indicator) => (
                  <li key={indicator.id} className="flex items-center gap-2 text-[13px]">
                    <span className="flex-1 text-text-muted">{indicator.name}</span>
                    <SourceTag type={indicator.sourceType} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Sources">
        <p className="text-sm text-text-muted">
          Background from the NASA Human Research Program and the Canadian Space Agency, plus the
          2026 NASA Space Apps Challenge statement. Thresholds are general adult reference ranges or
          demo values, not taken from these sources.
        </p>
        <ul className="flex flex-col gap-1.5 text-sm">
          {CITED.map((article) => (
            <li key={article.title} className="flex items-baseline gap-2">
              <span className="reading w-9 shrink-0 text-xs text-text-muted">{article.agency}</span>
              {article.url ? (
                <a
                  href={article.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent underline-offset-2 hover:underline"
                >
                  {article.title}
                  <ExternalLink size={12} strokeWidth={1.5} aria-label="(opens in a new tab)" />
                </a>
              ) : (
                <span className="text-text">{article.title}</span>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <section
        aria-label="Disclaimer"
        className="flex gap-2.5 rounded-panel border border-space-700 bg-space-900 px-4 py-3 text-sm text-text"
      >
        <Info size={18} strokeWidth={1.5} className="mt-0.5 shrink-0 text-accent" aria-hidden />
        <p>{DISCLAIMER}</p>
      </section>

      <Section title="Start again">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              updateSettings({ tourSeen: false })
              navigate('/')
            }}
          >
            Take the tour again
          </button>
          <button
            type="button"
            className={buttonClass}
            onClick={() => {
              updateSettings({ welcomeSeen: false, tourSeen: false })
              navigate('/')
            }}
          >
            Show the welcome again
          </button>
          {!confirmReset && (
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                setConfirmReset(true)
                setResetDone(false)
              }}
            >
              Reset demo data…
            </button>
          )}
        </div>
        {confirmReset && (
          <div role="alert" className="flex flex-col gap-2 text-sm">
            <p className="text-text">
              Remove the check-ins and events you added for the demo crew? Your own profiles stay.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  resetDemoData()
                  setConfirmReset(false)
                  setResetDone(true)
                }}
                className="h-10 rounded-control border border-alert px-3 font-semibold text-alert-text hover:bg-alert/10"
              >
                Reset demo data
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="h-10 rounded-control border border-space-700 px-3 font-semibold text-text hover:bg-space-800"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {resetDone && (
          <p role="status" className="text-sm text-text-muted">
            <span className="text-ok" aria-hidden>
              ✓{' '}
            </span>
            Demo data reset.
          </p>
        )}
      </Section>
    </div>
  )
}
