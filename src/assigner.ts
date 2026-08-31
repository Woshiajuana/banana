import type { Metadata, Options } from './types'
import { getChildrenMetadata, isFunction, normalizeMetadata } from './utils'

export interface AssignOptions extends Options {}

export async function assign(
  source: Record<string, any>,
  metadata: Metadata,
  options: AssignOptions = {},
) {
  const fields = normalizeMetadata(metadata)
  const { recursive } = options

  for (const field of fields) {
    // eslint-disable-next-line prefer-const
    let { set, key } = field

    const children = getChildrenMetadata(field, options)
    if (recursive === true && children) {
      await assign(source, children, options)
    }

    if (!key) {
      continue
    }

    const value = source[key]
    if (isFunction(set)) {
      set(source, field, metadata)
    } else if (typeof value !== 'undefined') {
      field.value = value
    }
  }
}
