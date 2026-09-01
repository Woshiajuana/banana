export interface Options {
  // 是否递归验证子级 默认 false
  recursive?: boolean

  // 子级字段名 默认 children
  childrenField?: string

  // 是否并行执行 默认 false
  parallel?: boolean
}

export type Validator = (value: unknown, field: Field, metadata: Metadata) => void | Promise<void>

export type Rule =
  | {
      validator?: Validator
      message?: string
      required?: boolean
    }
  | Validator

export interface Field<S = any> {
  key?: string
  value?: unknown
  defaultValue?: unknown | ((value: unknown, field: Field, metadata: Metadata) => unknown)
  rules?: Rule[]
  hidden?: boolean | ((value: unknown, field: Field, metadata: Metadata) => boolean)
  set?: (source: S, field: Field, data: Metadata) => void | Promise<void>
  get?: (value: unknown, field: Field, data: Metadata) => unknown | Promise<unknown>
  children?: Metadata
  [key: string]: unknown
}

export type Metadata<S = any> = Record<string, Field<S>> | Field<S>[]
