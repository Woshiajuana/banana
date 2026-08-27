import type { Field, Metadata } from './types'

export function normalizeMetadata(metadata: Metadata): Field[] {
  if (Array.isArray(metadata)) {
    return metadata
  }

  return Object.entries(metadata).map(([key, field]) => ({
    key,
    ...field,
  }))
}
