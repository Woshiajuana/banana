import type { Metadata, Options } from './types'
import { getChildrenMetadata, normalizeMetadata } from './utils'

export interface ExtractOptions extends Options {}

export async function extract(metadata: Metadata, options: ExtractOptions = {}) {
  const result: Record<string, unknown> = {}
  const fields = normalizeMetadata(metadata)

  for (const field of fields) {
    const value = field.value === undefined ? field.defaultValue : field.value
    const hidden =
      typeof field.hidden === 'function'
        ? field.hidden(value, field, metadata)
        : field.hidden === true

    if (hidden || !field.key) {
      continue
    }

    const children = getChildrenMetadata(field, options)

    if (options.recursive === true && children) {
      result[field.key] = await extract(children, options)
      continue
    }

    result[field.key] = field.get ? await field.get(value, field, metadata) : value
  }

  return result
}
