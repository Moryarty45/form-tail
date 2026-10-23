import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Геннадьевич", weight: 1, gender: "male" },
  { value: "Геннадьевна", weight: 1, gender: "female" },
  { value: "Георгиевич", weight: 1, gender: "male" },
  { value: "Георгиевна", weight: 1, gender: "female" },
  { value: "Германович", weight: 1, gender: "male" },
  { value: "Германовна", weight: 1, gender: "female" },
  { value: "Глебович", weight: 1, gender: "male" },
  { value: "Глебовна", weight: 1, gender: "female" },
  { value: "Григорьевич", weight: 1, gender: "male" },
] as const satisfies readonly LexiconEntry[]

export default entries
