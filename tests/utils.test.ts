import { describe, expect, it } from 'vitest'

import type { Field } from '../src/types'
import { normalizeMetadata } from '../src/utils'

describe('normalizeMetadata', () => {
  it('returns array metadata directly', () => {
    const fields: Field[] = [{ key: 'name', value: 'banana' }]

    expect(normalizeMetadata(fields)).toBe(fields)
  })

  it('converts object metadata to fields array', () => {
    expect(
      normalizeMetadata({
        name: {
          value: 'banana',
        },
      }),
    ).toEqual([
      {
        key: 'name',
        value: 'banana',
      },
    ])
  })

  it('keeps explicit field key over object key', () => {
    expect(
      normalizeMetadata({
        name: {
          key: 'username',
          value: 'banana',
        },
      }),
    ).toEqual([
      {
        key: 'username',
        value: 'banana',
      },
    ])
  })
})
