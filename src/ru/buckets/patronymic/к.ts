import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Кириллович", weight: 1, gender: "male" },
  { value: "Кирилловна", weight: 1, gender: "female" },
  { value: "Климович", weight: 1, gender: "male" },
  { value: "Климовна", weight: 1, gender: "female" },
  { value: "Константинович", weight: 1, gender: "male" },
  { value: "Константиновна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
