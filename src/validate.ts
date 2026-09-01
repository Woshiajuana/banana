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
}

export async function validate(metadata: Metadata, options: ValidateOptions = {}) {
  const fields = normalizeMetadata(metadata)
  const { recursive = false, parallel = false } = options

  const processField = async ({ field, key }: NormalizedMetadataItem) => {
    // eslint-disable-next-line prefer-const
    let { value, rules, hidden } = field

    const children = getChildrenMetadata(field, options)
    if (recursive && children) {
      await validate(children, options)
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
}
