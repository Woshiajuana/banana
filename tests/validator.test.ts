import { describe, expect, it, vi } from 'vitest'

import type { Metadata } from '../src/types'
import { validate } from '../src/validate'

describe('validate', () => {
  it('validates object metadata and returns extracted values by default', async () => {
    await expect(
      validate({
        name: {
          value: 'banana',
          rules: [{ required: true }],
        },
      }),
    ).resolves.toEqual({
      name: 'banana',
    })
  })

  it('validates array metadata and returns extracted values by default', async () => {
    await expect(
      validate([
        {
          key: 'name',
          value: 'banana',
          rules: [{ required: true }],
        },
      ]),
    ).resolves.toEqual({
      name: 'banana',
    })
  })

  it('returns undefined when extract is false', async () => {
    await expect(
      validate(
        {
          name: {
            value: 'banana',
            rules: [{ required: true }],
          },
        },
        { extract: false },
      ),
    ).resolves.toBeUndefined()
  })

  it.each([undefined, null, '', [], {}, NaN])(
    'throws when required value is empty: %s',
    async (value) => {
      await expect(
        validate({
          name: {
            value,
            rules: [{ required: true }],
          },
        }),
      ).rejects.toThrow('This field is required')
    },
  )

  it.each([0, false, ['banana'], { name: 'banana' }])(
    'accepts required non-empty value: %s',
    async (value) => {
      await expect(
        validate(
          {
            name: {
              value,
              rules: [{ required: true }],
            },
          },
          { extract: false },
        ),
      ).resolves.toBeUndefined()
    },
  )

  it('does not add key to object metadata fields', async () => {
    const metadata: Metadata = {
      name: {
        value: 'banana',
        rules: [{ required: true }],
      },
    }

    await validate(metadata, { extract: false })

    expect(metadata.name).toEqual({
      value: 'banana',
      rules: [{ required: true }],
    })
  })

  it('passes explicit field key to onError', async () => {
    const onError = vi.fn()
    const metadata: Metadata = {
      name: {
        key: 'username',
        value: '',
        rules: [{ required: true, message: '请输入名称' }],
      },
    }

    await validate(metadata, { onError })

    expect(onError).toHaveBeenCalledWith({
      error: expect.objectContaining({ message: '请输入名称' }),
      field: metadata.name,
      key: 'username',
      metadata,
    })
  })

  it('supports parallel field validation', async () => {
    const calls: string[] = []

    await expect(
      validate(
        {
          slow: {
            value: 'slow',
            rules: [
              async () => {
                await new Promise((resolve) => setTimeout(resolve, 20))
                calls.push('slow')
              },
            ],
          },
          fast: {
            value: 'fast',
            rules: [
              () => {
                calls.push('fast')
              },
            ],
          },
        },
        { parallel: true, extract: false },
      ),
    ).resolves.toBeUndefined()
    expect(calls).toEqual(['fast', 'slow'])
  })

  it('uses custom required message', async () => {
    await expect(
      validate({
        name: {
          value: '',
          rules: [{ required: true, message: '请输入名称' }],
        },
      }),
    ).rejects.toThrow('请输入名称')
  })

  it('does not use defaultValue when value is undefined', async () => {
    await expect(
      validate({
        name: {
          defaultValue: 'banana',
          rules: [{ required: true }],
        },
      }),
    ).rejects.toThrow('This field is required')
  })

  it('prefers value over defaultValue', async () => {
    await expect(
      validate({
        name: {
          value: '',
          defaultValue: 'banana',
          rules: [{ required: true }],
        },
      }),
    ).rejects.toThrow('This field is required')
  })

  it('supports function validator', async () => {
    await expect(
      validate({
        name: {
          value: 'bad',
          rules: [
            () => {
              throw new Error('invalid value')
            },
          ],
        },
      }),
    ).rejects.toThrow('invalid value')
  })

  it('supports async validator', async () => {
    await expect(
      validate({
        name: {
          value: 'bad',
          rules: [
            async () => {
              throw new Error('async invalid value')
            },
          ],
        },
      }),
    ).rejects.toThrow('async invalid value')
  })

  it('passes value, field, and metadata to validator', async () => {
    const validator = vi.fn()
    const metadata: Metadata = {
      name: {
        value: 'banana',
        rules: [validator],
      },
    }

    await validate(metadata, { extract: false })

    expect(validator).toHaveBeenCalledWith(
      'banana',
      expect.objectContaining({ value: 'banana' }),
      metadata,
    )
  })

  it('throws original validator error without wrapping rule message', async () => {
    await expect(
      validate({
        name: {
          value: 'bad',
          rules: [
            {
              message: '自定义错误',
              validator() {
                throw new Error('原始错误')
              },
            },
          ],
        },
      }),
    ).rejects.toThrow('原始错误')
  })

  it('skips hidden field', async () => {
    await expect(
      validate({
        name: {
          hidden: true,
          value: '',
          rules: [{ required: true }],
        },
      }),
    ).resolves.toEqual({})
  })

  it('validates field when hidden is false', async () => {
    await expect(
      validate({
        name: {
          hidden: false,
          value: '',
          rules: [{ required: true }],
        },
      }),
    ).rejects.toThrow('This field is required')
  })

  it('skips field when hidden function returns true', async () => {
    await expect(
      validate({
        name: {
          hidden: (value) => value === 'skip',
          value: 'skip',
          rules: [
            () => {
              throw new Error('should not run')
            },
          ],
        },
      }),
    ).resolves.toEqual({})
  })

  it('validates field when hidden function returns false', async () => {
    await expect(
      validate({
        name: {
          hidden: () => false,
          value: '',
          rules: [{ required: true }],
        },
      }),
    ).rejects.toThrow('This field is required')
  })

  it('calls onError and continues validating next fields', async () => {
    const onError = vi.fn()
    const nextValidator = vi.fn()

    await validate(
      {
        name: {
          value: '',
          rules: [{ required: true, message: '请输入名称' }],
        },
        age: {
          value: 18,
          rules: [nextValidator],
        },
      },
      { onError },
    )

    expect(onError).toHaveBeenCalledOnce()
    expect(onError).toHaveBeenCalledWith({
      error: expect.objectContaining({ message: '请输入名称' }),
      field: expect.objectContaining({ value: '', rules: expect.any(Array) }),
      key: 'name',
      metadata: expect.any(Object),
    })
    expect(nextValidator).toHaveBeenCalledOnce()
  })

  it('calls onError as a notification callback', async () => {
    const errors: string[] = []

    await validate(
      {
        name: {
          value: '',
          rules: [{ required: true, message: '请输入名称' }],
        },
      },
      {
        onError({ error }) {
          errors.push(error instanceof Error ? error.message : String(error))
        },
      },
    )

    expect(errors).toEqual(['请输入名称'])
  })

  it('stops validation when onError throws', async () => {
    await expect(
      validate(
        {
          name: {
            value: '',
            rules: [{ required: true }],
          },
        },
        {
          onError() {
            throw new Error('onError failed')
          },
        },
      ),
    ).rejects.toThrow('onError failed')
  })

  it('does not validate children by default', async () => {
    await expect(
      validate(
        {
          user: {
            children: {
              name: {
                value: '',
                rules: [{ required: true }],
              },
            },
          },
        },
        { extract: false },
      ),
    ).resolves.toBeUndefined()
  })

  it('validates children when recursive is true', async () => {
    await expect(
      validate(
        {
          user: {
            children: {
              name: {
                value: '',
                rules: [{ required: true }],
              },
            },
          },
        },
        { recursive: true },
      ),
    ).rejects.toThrow('This field is required')
  })

  it('supports custom children field', async () => {
    const metadata: Metadata = {
      user: {
        fields: {
          name: {
            value: '',
            rules: [{ required: true, message: '请输入名称' }],
          },
        },
      },
    }

    await expect(
      validate(metadata, {
        recursive: true,
        childrenField: 'fields',
      }),
    ).rejects.toThrow('请输入名称')
  })

  it('ignores custom children field when recursive is false', async () => {
    await expect(
      validate(
        {
          user: {
            fields: {
              name: {
                value: '',
                rules: [{ required: true }],
              },
            },
          },
        },
        {
          childrenField: 'fields',
          extract: false,
        },
      ),
    ).resolves.toBeUndefined()
  })

  it('short-circuits validator when required fails', async () => {
    const validator = vi.fn()

    await expect(
      validate({
        name: {
          value: '',
          rules: [{ required: true, validator }],
        },
      }),
    ).rejects.toThrow('This field is required')

    expect(validator).not.toHaveBeenCalled()
  })

  it('runs rules in order and stops at the first thrown error', async () => {
    const first = vi.fn()
    const second = vi.fn(() => {
      throw new Error('second failed')
    })
    const third = vi.fn()

    await expect(
      validate({
        name: {
          value: 'banana',
          rules: [first, second, third],
        },
      }),
    ).rejects.toThrow('second failed')

    expect(first).toHaveBeenCalledOnce()
    expect(second).toHaveBeenCalledOnce()
    expect(third).not.toHaveBeenCalled()
  })
})
