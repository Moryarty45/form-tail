import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Евгеньевич", weight: 1, gender: "male" },
  { value: "Евгеньевна", weight: 1, gender: "female" },
  { value: "Егорович", weight: 1, gender: "male" },
  { value: "Егоровна", weight: 1, gender: "female" },
  { value: "Елисеевич", weight: 1, gender: "male" },
  { value: "Елисеевна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
