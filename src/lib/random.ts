// A small seeded random number generator, so demo data is the same on every load.
// Same seed → same sequence of numbers. Not for anything security-related.

export type Random = {
  /** Uniform number in [0, 1) */
  next: () => number
  /** Normally distributed number (bell curve) with the given mean and spread */
  normal: (mean: number, sd: number) => number
  /** true with the given probability (0–1) */
  chance: (probability: number) => boolean
}

/** Turns a text like "demo-vega:mars" into a 32-bit seed */
export function hashSeed(text: string): number {
  let hash = 2166136261 // FNV-1a
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/** mulberry32: a tiny, fast generator with good enough randomness for demo data */
export function createRandom(seed: number | string): Random {
  let state = typeof seed === 'string' ? hashSeed(seed) : seed >>> 0
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    // Box–Muller transform: two uniform numbers → one normal number
    normal: (mean, sd) => {
      const u = 1 - next() // avoid log(0)
      const v = next()
      return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    },
    chance: (probability) => next() < probability,
  }
}
