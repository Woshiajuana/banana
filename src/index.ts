export * from './types'
export * from './extract'
export * from './validate'

import { extract } from './extract'
import { validate } from './validate'

export const banana = {
  extract,
  validate,
}

export default banana
