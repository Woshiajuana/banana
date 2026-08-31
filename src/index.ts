export * from './assign'
export * from './extract'
export * from './types'
export * from './validate'

import { assign } from './assign'
import { extract } from './extract'
import { validate } from './validate'

export const banana = {
  extract,
  validate,
  assign,
}

export default banana
