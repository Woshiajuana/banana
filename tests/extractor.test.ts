import { describe, expect, it, vi } from 'vitest'

import { extract } from '../src/extractor'
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

  it('uses defaultValue when value is undefined', async () => {
    await expect(
      extract({
        name: {
          defaultValue: 'banana',
        },
      }),
    ).resolves.toEqual({
      name: 'banana',
    })
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
      expect.objectContaining({ key: 'name', value: 'banana' }),
      metadata,
    )
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

  it('extracts children when recursive is true', async () => {
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
      user: {
        name: 'banana',
      },
    })
  })

  it('supports custom children field', async () => {
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
      user: {
        name: 'banana',
      },
    })
  })
})
