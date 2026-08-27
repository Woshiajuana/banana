import type { Field, Metadata, Rule } from './types'

export interface ValidateOptions {
  // 是否排除 hidden 项 默认 true
  excludeHiddenField?: boolean

  // 是否包含本身 value 默认 false
  includeSelfField?: boolean
}

export async function validate(metadata: Metadata, options: ValidateOptions = {}) {
  const fields = normalizeMetadata(metadata)

  for (const field of fields) {
    const value = getFieldValue(field)

    if (shouldSkipField(value, field, metadata, options)) {
      continue
    }

    if (shouldValidateSelf(field, options)) {
      await runRules(value, field, metadata)
    }

    if (field.children) {
      await validate(field.children, options)
    }
  }
}

export async function run(value: unknown, rule: Rule, field: Field = {}, metadata: Metadata = []) {
  if (typeof rule === 'function') {
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

function normalizeMetadata(metadata: Metadata): Field[] {
  if (Array.isArray(metadata)) {
    return metadata
  }

  return Object.entries(metadata).map(([key, field]) => ({
    key,
    ...field,
  }))
}

function getFieldValue(field: Field) {
  return field.value === undefined ? field.defaultValue : field.value
}

function shouldSkipField(
  value: unknown,
  field: Field,
  metadata: Metadata,
  options: ValidateOptions,
) {
  if (options.excludeHiddenField === false) {
    return false
  }

  if (typeof field.hidden === 'function') {
    return field.hidden(value, field, metadata)
  }

  return field.hidden === true
}

function shouldValidateSelf(field: Field, options: ValidateOptions) {
  if (!field.children) {
    return true
  }

  return options.includeSelfField === true
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
