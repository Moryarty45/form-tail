import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Йюрген", weight: 1, gender: "male" },
] as const satisfies readonly LexiconEntry[]

export default entries
