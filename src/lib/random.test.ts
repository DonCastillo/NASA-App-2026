import { describe, expect, it } from 'vitest'
import { createRandom, hashSeed } from './random'

describe('createRandom', () => {
  it('gives the same sequence for the same seed, and a different one for another seed', () => {
    const take = (seed: string) => {
      const random = createRandom(seed)
      return Array.from({ length: 5 }, () => random.next())
    }
    expect(take('demo-vega:mars')).toEqual(take('demo-vega:mars'))
    expect(take('demo-vega:mars')).not.toEqual(take('demo-vega:iss'))
  })

  it('stays within [0, 1) and averages about 0.5', () => {
    const random = createRandom(42)
    const values = Array.from({ length: 5000 }, () => random.next())
    expect(Math.min(...values)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...values)).toBeLessThan(1)
    expect(values.reduce((a, b) => a + b, 0) / values.length).toBeCloseTo(0.5, 1)
  })

  it('draws normal values around the mean', () => {
    const random = createRandom(7)
    const values = Array.from({ length: 5000 }, () => random.normal(36.7, 0.2))
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    expect(mean).toBeCloseTo(36.7, 1)
  })

  it('hashes text to a stable 32-bit seed', () => {
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
    expect(hashSeed('abc')).toBeGreaterThanOrEqual(0)
    expect(hashSeed('abc')).toBeLessThan(2 ** 32)
  })
})
