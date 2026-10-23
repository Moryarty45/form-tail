import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Тимофеевич", weight: 1, gender: "male" },
  { value: "Тимофеевна", weight: 1, gender: "female" },
  { value: "Тимурович", weight: 1, gender: "male" },
  { value: "Тимуровна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
