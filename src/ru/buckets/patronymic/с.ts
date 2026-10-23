import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Савельевич", weight: 1, gender: "male" },
  { value: "Савельевна", weight: 1, gender: "female" },
  { value: "Святославович", weight: 1, gender: "male" },
  { value: "Святославовна", weight: 1, gender: "female" },
  { value: "Семенович", weight: 1, gender: "male" },
  { value: "Семеновна", weight: 1, gender: "female" },
  { value: "Сергеевич", weight: 1, gender: "male" },
  { value: "Сергеевна", weight: 1, gender: "female" },
  { value: "Степанович", weight: 1, gender: "male" },
  { value: "Степановна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
