export type Validator = (value: unknown, field: Field, metadata: Metadata) => void | Promise<void>

export type Rule =
  | {
      validator?: Validator
      message?: string
      required?: boolean
    }
  | Validator

export interface Field {
  key?: string
  value?: unknown
  defaultValue?: unknown
  rules?: Rule[]
  hidden?: boolean | ((value: unknown, field: Field, metadata: Metadata) => boolean)
  set?: (source: unknown, field: Field, data: Metadata) => void
  get?: (value: unknown, field: Field, data: Metadata) => unknown
  children?: Metadata
  [key: string]: unknown
}

export type Metadata = Record<string, Field> | Field[]
