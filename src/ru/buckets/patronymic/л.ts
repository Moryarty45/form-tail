import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Лаврентьевич", weight: 1, gender: "male" },
  { value: "Лаврентьевна", weight: 1, gender: "female" },
  { value: "Ларионович", weight: 1, gender: "male" },
  { value: "Ларионовна", weight: 1, gender: "female" },
  { value: "Леонидович", weight: 1, gender: "male" },
  { value: "Леонидовна", weight: 1, gender: "female" },
  { value: "Львович", weight: 1, gender: "male" },
  { value: "Львовна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
