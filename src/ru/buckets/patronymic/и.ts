import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Иванович", weight: 1, gender: "male" },
  { value: "Ивановна", weight: 1, gender: "female" },
  { value: "Игоревич", weight: 1, gender: "male" },
  { value: "Игоревна", weight: 1, gender: "female" },
  { value: "Илинична", weight: 1, gender: "female" },
  { value: "Ильич", weight: 1, gender: "male" },
  { value: "Инокентьевич", weight: 1, gender: "male" },
  { value: "Инокентьевна", weight: 1, gender: "female" },
  { value: "Ипполитович", weight: 1, gender: "male" },
  { value: "Ипполитовна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
