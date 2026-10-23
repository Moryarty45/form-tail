import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Чеслав", weight: 1, gender: "male" },
  { value: "Чеслава", weight: 1, gender: "female" },
  { value: "Чулпан", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
