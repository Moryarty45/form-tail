import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Никитична", weight: 1, gender: "female" },
  { value: "Никитович", weight: 1, gender: "male" },
  { value: "Николаевич", weight: 1, gender: "male" },
  { value: "Николаевна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
