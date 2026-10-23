import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Борисович", weight: 1, gender: "male" },
  { value: "Борисовна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
