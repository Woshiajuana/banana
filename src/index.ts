export * from './types'
export * from './extractor'
export * from './validator'

import { extract } from './extractor'
import { validate } from './validator'

export const banana = {
  extract,
  validate,
}

export default banana
