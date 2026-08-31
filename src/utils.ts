import type { Field, Metadata, Options } from './types'

export const isObject = (v: any) => Object.prototype.toString.call(v) === '[object Object]'

export function normalizeMetadata(metadata: Metadata): Field[] {
  if (Array.isArray(metadata)) {
    return metadata
  }

  return Object.entries(metadata).map(([key, field]) => ({
    key,
    ...field,
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
