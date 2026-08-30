import { describe, expect, it, vi } from 'vitest'

import type { Metadata } from '../src/types'
import { validate } from '../src/validator'

describe('validate', () => {
  it('validates object metadata', async () => {
    await expect(
      validate({
        name: {
          value: 'banana',
          rules: [{ required: true }],
        },
      }),
    ).resolves.toBeUndefined()
  })

  it('validates array metadata', async () => {
    await expect(
      validate([
        {
          key: 'name',
          value: 'banana',
          rules: [{ required: true }],
        },
      ]),
    ).resolves.toBeUndefined()
  })

  it.each([undefined, null, '', []])('throws when required value is empty: %s', async (value) => {
    await expect(
      validate({
        name: {
          value,
          rules: [{ required: true }],
        },
      }),
    ).rejects.toThrow('This field is required')
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

  it('uses defaultValue when value is undefined', async () => {
    await expect(
      validate({
        name: {
          defaultValue: 'banana',
          rules: [{ required: true }],
        },
      }),
    ).resolves.toBeUndefined()
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

    await validate(metadata)

    expect(validator).toHaveBeenCalledWith(
      'banana',
      expect.objectContaining({ key: 'name', value: 'banana' }),
      metadata,
    )
  })

  it('uses rule message and preserves original error as cause', async () => {
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
    ).rejects.toMatchObject({
      message: '自定义错误',
      cause: expect.objectContaining({
        message: '原始错误',
      }),
    })
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
    ).resolves.toBeUndefined()
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
    ).resolves.toBeUndefined()
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
    expect(onError.mock.calls[0]?.[0]).toMatchObject({ message: '请输入名称' })
    expect(onError.mock.calls[0]?.[1]).toMatchObject({ key: 'name' })
    expect(nextValidator).toHaveBeenCalledOnce()
  })

  it('supports async onError', async () => {
    const errors: string[] = []

    await validate(
      {
        name: {
          value: '',
          rules: [{ required: true, message: '请输入名称' }],
        },
      },
      {
        async onError(error) {
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
      validate({
        user: {
          children: {
            name: {
              value: '',
              rules: [{ required: true }],
            },
          },
        },
      }),
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
