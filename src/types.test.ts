import { describe, expect, expectTypeOf, it } from 'vitest'
import { SYSTEM_IDS, type ReadingValue, type Status, type SystemId } from './types'

describe('types', () => {
  it('has the 8 system slugs from plan/site-map.md, in order', () => {
    expect(SYSTEM_IDS).toEqual([
      'heart',
      'eyes',
      'bones',
      'immune',
      'metabolism',
      'mind',
      'balance',
      'radiation',
    ])
  })

  it('derives SystemId from the slug list', () => {
    expectTypeOf<'immune'>().toExtend<SystemId>()
    // @ts-expect-error — not a system slug
    expectTypeOf<'liver'>().toExtend<SystemId>()
  })

  it('allows "none" as a display status', () => {
    expectTypeOf<'none'>().toExtend<Status>()
  })

  it('accepts every reading shape, including skipped', () => {
    const values: ReadingValue[] = [38.2, [118, 76], true, ['coldSore'], null]
    expect(values).toHaveLength(5)
  })
})
