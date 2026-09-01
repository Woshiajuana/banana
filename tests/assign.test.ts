import { describe, expect, it, vi } from 'vitest'

import { assign } from '../src/assign'
import type { Metadata } from '../src/types'

describe('assign', () => {
  it('assigns values to object metadata', async () => {
    const metadata: Metadata = {
      name: {},
    }

    await assign({ name: 'banana' }, metadata)

    expect(metadata).toEqual({
      name: {
        value: 'banana',
      },
    })
  })

  it('assigns values to array metadata', async () => {
    const metadata: Metadata = [
      {
        key: 'name',
      },
    ]

    await assign({ name: 'banana' }, metadata)

    expect(metadata).toEqual([
      {
        key: 'name',
        value: 'banana',
      },
    ])
  })

  it('does not add key to object metadata fields', async () => {
    const metadata: Metadata = {
      name: {},
    }

    await assign({ name: 'banana' }, metadata)

    expect(metadata.name).toEqual({
      value: 'banana',
    })
  })

  it('prefers explicit field key in object metadata', async () => {
    const metadata: Metadata = {
      name: {
        key: 'username',
      },
    }

    await assign({ username: 'banana' }, metadata)

    expect(metadata.name).toEqual({
      key: 'username',
      value: 'banana',
    })
  })

  it('skips undefined source values', async () => {
    const metadata: Metadata = {
      name: {
        value: 'banana',
      },
    }

    await assign({ name: undefined }, metadata)

    expect(metadata.name).toEqual({
      value: 'banana',
    })
  })

  it('uses set hook', async () => {
    const set = vi.fn((source, field) => {
      field.value = `${source.name}-split`
    })
    const metadata: Metadata = {
      name: {
        set,
      },
    }

    await assign({ name: 'banana' }, metadata)

    expect(metadata.name).toEqual({
      set,
      value: 'banana-split',
    })
    expect(set).toHaveBeenCalledWith({ name: 'banana' }, metadata.name, metadata)
  })

  it('supports async set hook', async () => {
    const metadata: Metadata = {
      name: {
        async set(source, field) {
          field.value = `${source.name}-split`
        },
      },
    }

    await assign({ name: 'banana' }, metadata)

    expect(metadata.name.value).toBe('banana-split')
  })

  it('supports parallel field assignment', async () => {
    const calls: string[] = []
    const metadata: Metadata = {
      slow: {
        async set(source, field) {
          await new Promise((resolve) => setTimeout(resolve, 20))
          calls.push('slow')
          field.value = source.slow
        },
      },
      fast: {
        set(source, field) {
          calls.push('fast')
          field.value = source.fast
        },
      },
    }

    await assign({ slow: 'slow', fast: 'fast' }, metadata, { parallel: true })

    expect(metadata.slow.value).toBe('slow')
    expect(metadata.fast.value).toBe('fast')
    expect(calls).toEqual(['fast', 'slow'])
  })
})
