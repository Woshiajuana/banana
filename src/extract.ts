import type { Metadata, Options } from './types'
import type { NormalizedMetadataItem } from './utils'
import { getChildrenMetadata, isFunction, isObject, isUndefined, normalizeMetadata } from './utils'

export interface ExtractOptions extends Options {}

export async function extract<T extends Record<string, unknown> = Record<string, unknown>>(
  metadata: Metadata,
  options: ExtractOptions = {},
) {
  const result: Record<string, unknown> = {}
  const fields = normalizeMetadata(metadata)
  const { recursive = false, parallel = false } = options

  const processField = async ({ field, key }: NormalizedMetadataItem) => {
    const fieldResult: Record<string, unknown> = {}
    // eslint-disable-next-line prefer-const
    let { get, value, defaultValue, hidden } = field

    const children = getChildrenMetadata(field, options)
    if (recursive && children) {
      Object.assign(fieldResult, await extract(children, options))
    }

    if (isFunction(hidden)) {
      hidden = hidden(value, field, metadata)
    }
    if (hidden) {
      value = isFunction(defaultValue) ? defaultValue(value, field, metadata) : defaultValue
    }

    if (isUndefined(value) || !key) {
      return fieldResult
    }

    if (isFunction(get)) {
      value = await get(value, field, metadata)

      if (isObject(value)) {
        Object.assign(fieldResult, value)
      } else {
        fieldResult[key] = value
      }
    } else {
      fieldResult[key] = value
    }

    return fieldResult
  }

  if (parallel) {
    const results = await Promise.all(fields.map(processField))
    Object.assign(result, ...results)
  } else {
    for (const item of fields) {
      Object.assign(result, await processField(item))
    }
  }

  return result as T
}
