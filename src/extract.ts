import type { Metadata, Options } from './types'
import { getChildrenMetadata, isFunction, isObject, isUndefined, normalizeMetadata } from './utils'

export interface ExtractOptions extends Options {}

export async function extract<T extends Record<string, unknown> = Record<string, unknown>>(
  metadata: Metadata,
  options: ExtractOptions = {},
) {
  const result: Record<string, unknown> = {}
  const fields = normalizeMetadata(metadata)
  const { recursive } = options

  for (const field of fields) {
    // eslint-disable-next-line prefer-const
    let { get, value, defaultValue, key, hidden } = field

    const children = getChildrenMetadata(field, options)
    if (recursive === true && children) {
      Object.assign(result, await extract(children, options))
    }

    if (isFunction(hidden)) {
      hidden = hidden(value, field, metadata)
    }
    if (hidden) {
      value = isFunction(defaultValue) ? defaultValue(value) : defaultValue
    }

    if (isUndefined(value) || !key) {
      continue
    }

    if (isFunction(get)) {
      value = await get(value, field, metadata)

      if (isObject(value)) {
        Object.assign(result, value)
      } else {
        result[key] = value
      }
    } else {
      result[key] = value
    }
  }

  return result as T
}
