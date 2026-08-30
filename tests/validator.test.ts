import { describe, expect, it, vi } from 'vitest'

import type { Metadata } from '../src/types'
import { run, validate } from '../src/validator'

describe('run', () => {
  it('passes when required value is present', async () => {
    await expect(run('banana', { required: true })).resolves.toBeUndefined()
  })

  it.each([undefined, null, '', []])('throws when required value is empty: %s', async (value) => {
    await expect(run(value, { required: true })).rejects.toThrow('This field is required')
  })

  it('uses custom required message', async () => {
    await expect(run('', { required: true, message: '请输入名称' })).rejects.toThrow('请输入名称')
  })

  it('supports function validator', async () => {
    await expect(
      run('bad', () => {
        throw new Error('invalid value')
      }),
    ).rejects.toThrow('invalid value')
  })

  it('supports async validator', async () => {
    await expect(
      run('bad', async () => {
        throw new Error('async invalid value')
      }),
    ).rejects.toThrow('async invalid value')
  })

  it('uses rule message and preserves original error as cause', async () => {
    await expect(
      run('bad', {
        message: '自定义错误',
        validator() {
          throw new Error('原始错误')
        },
      }),
    ).rejects.toMatchObject({
      message: '自定义错误',
      cause: expect.objectContaining({
        message: '原始错误',
      }),
    })
  })
})

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
    expect(nextValidator).toHaveBeenCalledOnce()
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
})
