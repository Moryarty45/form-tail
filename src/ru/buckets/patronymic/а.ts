import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Александрович", weight: 1, gender: "male" },
  { value: "Александровна", weight: 1, gender: "female" },
  { value: "Алексеевич", weight: 1, gender: "male" },
  { value: "Алексеевна", weight: 1, gender: "female" },
  { value: "Андреевич", weight: 1, gender: "male" },
  { value: "Андреевна", weight: 1, gender: "female" },
  { value: "Антонович", weight: 1, gender: "male" },
  { value: "Антоновна", weight: 1, gender: "female" },
  { value: "Арсеньевич", weight: 1, gender: "male" },
  { value: "Артемович", weight: 1, gender: "male" },
  { value: "Артемовна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
