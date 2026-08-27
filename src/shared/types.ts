export type Validator = (value: unknown, field: any, metadata: any) => void

export type AsyncValidator = () => any

export type Rule =
  { validator?: RegExp | Validator; message?: string; required?: boolean } | Validator
