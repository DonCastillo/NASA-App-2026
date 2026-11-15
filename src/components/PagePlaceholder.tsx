import type { ReactNode } from 'react'

type Props = {
  title: string
  phase: string
  children?: ReactNode
}

// Temporary content for pages that aren't built yet. Removed as each page is built.
export default function PagePlaceholder({ title, phase, children }: Props) {
  return (
    <section className="p-8">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-text-muted">Placeholder — built in {phase}.</p>
      {children}
    </section>
  )
}
