import type { Field, Metadata, Options } from './types'

export const isObject = (v: unknown): v is Record<string, unknown> =>
  Object.prototype.toString.call(v) === '[object Object]'

export const isFunction = <T extends (...args: any[]) => any>(v: unknown): v is T =>
  typeof v === 'function'

export const isUndefined = (v: unknown): v is undefined => typeof v === 'undefined'

export function isEmpty(value: unknown) {
  return (
    isUndefined(value) ||
    value === null ||
    value === '' ||
    Number.isNaN(value) ||
    (Array.isArray(value) && value.length === 0) ||
    (isObject(value) && Object.keys(value).length === 0)
  )
}

export interface NormalizedMetadataItem {
  field: Field
  key?: string
}
export function normalizeMetadata(metadata: Metadata): NormalizedMetadataItem[] {
  if (Array.isArray(metadata)) {
    return metadata.map((field) => ({
      field,
      key: field.key,
    }))
  }

  return Object.entries(metadata).map(([key, field]) => ({
    field,
    key,
  }))
}

export function getChildrenMetadata(field: Field, options: Options): Metadata | undefined {
  const children = field[options.childrenField ?? 'children']

  if (Array.isArray(children)) {
    return children as Metadata
  }

  if (children && typeof children === 'object') {
    return children as Metadata
  }

  return undefined
}
