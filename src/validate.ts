import type { Field, Metadata, Options, Rule } from './types'
import { getChildrenMetadata, isFunction, normalizeMetadata } from './utils'

export interface ValidateOptions extends Options {
  onError?: (error: unknown, field: Field, metadata: Metadata) => void | Promise<void>
}

export async function validate(metadata: Metadata, options: ValidateOptions = {}) {
  const fields = normalizeMetadata(metadata)

  for (const field of fields) {
    const value = field.value === undefined ? field.defaultValue : field.value
    const hidden = isFunction(field.hidden)
      ? field.hidden(value, field, metadata)
      : field.hidden === true

    if (hidden) {
      continue
    }

    try {
      await runRules(value, field, metadata)
    } catch (error) {
      if (!options.onError) {
        throw error
      }

      await options.onError(error, field, metadata)
    }

    const children = getChildrenMetadata(field, options)

    if (options.recursive === true && children) {
      await validate(children, options)
    }
  }
}

async function run(value: unknown, rule: Rule, field: Field = {}, metadata: Metadata = []) {
  if (isFunction(rule)) {
    await rule(value, field, metadata)
    return
  }

  if (rule.required && isEmpty(value)) {
    throw new Error(rule.message ?? 'This field is required')
  }

  if (!rule.validator) {
    return
  }

  try {
    await rule.validator(value, field, metadata)
  } catch (error) {
    if (rule.message) {
      throw new Error(rule.message, { cause: error })
    }

    throw error
  }
}

async function runRules(value: unknown, field: Field, metadata: Metadata) {
  for (const rule of field.rules ?? []) {
    await run(value, rule, field, metadata)
  }
}

function isEmpty(value: unknown) {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}
