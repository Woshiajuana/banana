import type { Metadata, Options } from './types'
import type { NormalizedMetadataItem } from './utils'
import { getChildrenMetadata, isFunction, isUndefined, normalizeMetadata } from './utils'

export interface AssignOptions extends Options {}

export async function assign(
  source: Record<string, any>,
  metadata: Metadata,
  options: AssignOptions = {},
) {
  const fields = normalizeMetadata(metadata)
  const { recursive = false, parallel = false } = options

  const processField = async ({ field, key }: NormalizedMetadataItem) => {
    // eslint-disable-next-line prefer-const
    let { set } = field

    const children = getChildrenMetadata(field, options)
    if (recursive && children) {
      await assign(source, children, options)
    }

    if (!key) {
      return
    }

    const value = source[key]
    if (isFunction(set)) {
      await set(source, field, metadata)
    } else if (!isUndefined(value)) {
      field.value = value
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
