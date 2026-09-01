import { extract as extractMetadata } from './extract'
import type { Field, Metadata, Options } from './types'
import type { NormalizedMetadataItem } from './utils'
import { getChildrenMetadata, isEmpty, isFunction, normalizeMetadata } from './utils'

export interface ValidateErrorContext {
  error: unknown
  field: Field
  key?: string
  metadata: Metadata
}

export interface ValidateOptions extends Options {
  onError?: (context: ValidateErrorContext) => void
  extract?: boolean
}

export interface ValidateExtractOptions extends ValidateOptions {
  extract?: true
}

export interface ValidateOnlyOptions extends ValidateOptions {
  extract: false
}

export function validate<T extends Record<string, unknown> = Record<string, unknown>>(
  metadata: Metadata,
  options?: ValidateExtractOptions,
): Promise<T>
export function validate(metadata: Metadata, options: ValidateOnlyOptions): Promise<void>
export async function validate<T extends Record<string, unknown> = Record<string, unknown>>(
  metadata: Metadata,
  options: ValidateOptions = {},
): Promise<T | void> {
  const fields = normalizeMetadata(metadata)
  const { recursive = false, parallel = false, extract = true } = options

  const processField = async ({ field, key }: NormalizedMetadataItem) => {
    // eslint-disable-next-line prefer-const
    let { value, rules, hidden } = field

    const children = getChildrenMetadata(field, options)
    if (recursive && children) {
      await validate(children, {
        ...options,
        extract: false,
      })
    }

    if (isFunction(hidden)) {
      hidden = hidden(value, field, metadata)
    }
    if (hidden || !rules || !rules.length) {
      return
    }

    try {
      for (const rule of rules) {
        if (isFunction(rule)) {
          await rule(value, field, metadata)
          continue
        }

        if (rule.required && isEmpty(value)) {
          throw new Error(rule.message ?? 'This field is required')
        }

        if (!rule.validator) {
          continue
        }

        await rule.validator(value, field, metadata)
      }
    } catch (error) {
      if (!options.onError) {
        throw error
      }

      options.onError({
        error,
        field,
        key,
        metadata,
      })
    }
  }

  if (parallel) {
    await Promise.all(fields.map(processField))
  } else {
    for (const item of fields) {
      await processField(item)
    }
  }

  if (extract) {
    return extractMetadata<T>(metadata, options)
  }
}
