export * from './types'
export * from './extract'
export * from './validate'
export * from './assign'

import { extract } from './extract'
import { validate } from './validate'
import { assign } from './assign'

export const banana = {
  extract,
  validate,
  assign,
}

export default banana
