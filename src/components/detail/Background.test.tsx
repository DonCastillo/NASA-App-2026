import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { SYSTEMS } from '../../data/systems'
import Background from './Background'

const eyes = SYSTEMS.find((s) => s.id === 'eyes')!

describe('Background', () => {
  it('starts collapsed and opens each section on click', async () => {
    const user = userEvent.setup()
    const { container } = render(<Background system={eyes} />)
    const sections = [...container.querySelectorAll('details')]
    expect(sections).toHaveLength(3)
    expect(sections.every((d) => !d.open)).toBe(true)

    await user.click(screen.getByText('Why this changes in space'))
    expect(sections[0].open).toBe(true)
    expect(sections[0]).toHaveTextContent('About 70% of ISS astronauts show some swelling')
  })

  it('lists measuring steps for every indicator', () => {
    const { container } = render(<Background system={eyes} />)
    const measure = container.querySelectorAll('details')[1]
    for (const indicator of eyes.indicators) {
      expect(within(measure).getByRole('heading', { name: indicator.name })).toBeInTheDocument()
    }
    expect(measure).toHaveTextContent(eyes.indicators[0].howToMeasure[0])
  })

  it('links sources to their original pages in a new tab, and keeps the disclaimer', () => {
    const { container } = render(<Background system={eyes} />)
    const sources = container.querySelectorAll('details')[2]
    expect(sources.querySelector('summary')).toHaveTextContent(/^▸Sources \(\d+\)$/)
    const sans = within(sources).getByRole('link', { name: /neuro-ocular syndrome/i })
    expect(sans).toHaveAttribute('href', expect.stringMatching(/^https:\/\/www\.nasa\.gov\//))
    expect(sans).toHaveAttribute('target', '_blank')
    expect(sans).toHaveAttribute('rel', 'noreferrer')
    expect(sources).toHaveTextContent('not medical advice')
  })
})
