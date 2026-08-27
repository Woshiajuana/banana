import type { Metadata, Rule } from '../shared'

export interface ValidateOptions {
  // 是否排除 hidden 项 默认 true
  excludeHiddenField?: boolean

  // 是否包含本身 value 默认 false
  includeSelfField?: boolean
}

export async function validate(metadata: Metadata, options: ValidateOptions) {
  //
}

export async function run(value: unknown, rule: Rule) {
  //
}
