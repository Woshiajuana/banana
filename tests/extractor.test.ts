import { describe, expect, it, vi } from 'vitest'

import { extract } from '../src/extract'
import type { Metadata } from '../src/types'

describe('extract', () => {
  it('extracts values from object metadata', async () => {
    await expect(
      extract({
        name: {
          value: 'banana',
        },
      }),
    ).resolves.toEqual({
      name: 'banana',
    })
  })

  it('extracts values from array metadata', async () => {
    await expect(
      extract([
        {
          key: 'name',
          value: 'banana',
        },
      ]),
    ).resolves.toEqual({
      name: 'banana',
    })
  })

  it('skips undefined value even when defaultValue is set', async () => {
    await expect(
      extract({
        name: {
          defaultValue: 'banana',
        },
      }),
    ).resolves.toEqual({})
  })

  it('prefers value over defaultValue', async () => {
    await expect(
      extract({
        name: {
          value: '',
          defaultValue: 'banana',
        },
      }),
    ).resolves.toEqual({
      name: '',
    })
  })

  it('uses defaultValue when field is hidden', async () => {
    await expect(
      extract({
        name: {
          hidden: true,
          value: 'banana',
          defaultValue: 'default name',
        },
      }),
    ).resolves.toEqual({
      name: 'default name',
    })
  })

  it('skips hidden field without defaultValue', async () => {
    await expect(
      extract({
        name: {
          hidden: true,
          value: 'banana',
        },
      }),
    ).resolves.toEqual({})
  })

  it('uses defaultValue when hidden function returns true', async () => {
    await expect(
      extract({
        name: {
          hidden: (value) => value === 'skip',
          value: 'skip',
          defaultValue: 'default name',
        },
      }),
    ).resolves.toEqual({
      name: 'default name',
    })
  })

  it('skips field when hidden function returns true without defaultValue', async () => {
    await expect(
      extract({
        name: {
          hidden: (value) => value === 'skip',
          value: 'skip',
        },
      }),
    ).resolves.toEqual({})
  })

  it('uses field get hook', async () => {
    const get = vi.fn((value) => `${value}-split`)
    const metadata: Metadata = {
      name: {
        value: 'banana',
        get,
      },
    }

    await expect(extract(metadata)).resolves.toEqual({
      name: 'banana-split',
    })
    expect(get).toHaveBeenCalledWith(
      'banana',
      expect.objectContaining({ value: 'banana' }),
      metadata,
    )
  })

  it('prefers explicit field key in object metadata', async () => {
    await expect(
      extract({
        name: {
          key: 'username',
          value: 'banana',
        },
      }),
    ).resolves.toEqual({
      username: 'banana',
    })
  })

  it('does not add key to object metadata fields', async () => {
    const metadata: Metadata = {
      name: {
        value: 'banana',
      },
    }

    await extract(metadata)

    expect(metadata.name).toEqual({
      value: 'banana',
    })
  })

  it('passes value, field, and metadata to defaultValue function', async () => {
    const defaultValue = vi.fn((value) => `${value}-default`)
    const metadata: Metadata = {
      name: {
        hidden: true,
        value: 'banana',
        defaultValue,
      },
    }

    await expect(extract(metadata)).resolves.toEqual({
      name: 'banana-default',
    })
    expect(defaultValue).toHaveBeenCalledWith('banana', metadata.name, metadata)
  })

  it('supports async get hook', async () => {
    await expect(
      extract({
        name: {
          value: 'banana',
          async get(value) {
            return `${value}-split`
          },
        },
      }),
    ).resolves.toEqual({
      name: 'banana-split',
    })
  })

  it('supports parallel get hooks', async () => {
    const calls: string[] = []

    await expect(
      extract(
        {
          slow: {
            value: 'slow',
            async get(value) {
              await new Promise((resolve) => setTimeout(resolve, 20))
              calls.push('slow')
              return value
            },
          },
          fast: {
            value: 'fast',
            get(value) {
              calls.push('fast')
              return value
            },
          },
        },
        { parallel: true },
      ),
    ).resolves.toEqual({
      slow: 'slow',
      fast: 'fast',
    })
    expect(calls).toEqual(['fast', 'slow'])
  })

  it('merges object returned from get hook into result', async () => {
    await expect(
      extract({
        name: {
          value: 'banana',
          get(value) {
            return {
              label: value,
              value,
            }
          },
        },
      }),
    ).resolves.toEqual({
      label: 'banana',
      value: 'banana',
    })
  })

  it('does not merge array returned from get hook', async () => {
    await expect(
      extract({
        names: {
          value: ['banana'],
          get(value) {
            return value
          },
        },
      }),
    ).resolves.toEqual({
      names: ['banana'],
    })
  })

  it('does not extract children by default', async () => {
    await expect(
      extract({
        user: {
          children: {
            name: {
              value: 'banana',
            },
          },
        },
      }),
    ).resolves.toEqual({
      user: undefined,
    })
  })

  it('extracts children as flat values when recursive is true', async () => {
    await expect(
      extract(
        {
          user: {
            children: {
              name: {
                value: 'banana',
              },
            },
          },
        },
        { recursive: true },
      ),
    ).resolves.toEqual({
      name: 'banana',
    })
  })

  it('supports custom children field with flat recursive extraction', async () => {
    await expect(
      extract(
        {
          user: {
            fields: {
              name: {
                value: 'banana',
              },
            },
          },
        },
        {
          recursive: true,
          childrenField: 'fields',
        },
      ),
    ).resolves.toEqual({
      name: 'banana',
    })
  })
})
