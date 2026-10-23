import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Павлович", weight: 1, gender: "male" },
  { value: "Павловна", weight: 1, gender: "female" },
  { value: "Петрович", weight: 1, gender: "male" },
  { value: "Петровна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
