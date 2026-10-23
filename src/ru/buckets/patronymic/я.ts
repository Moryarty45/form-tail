import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Ярославович", weight: 1, gender: "male" },
  { value: "Ярославовна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
