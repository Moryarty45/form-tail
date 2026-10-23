import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Даниилович", weight: 1, gender: "male" },
  { value: "Данииловна", weight: 1, gender: "female" },
  { value: "Данилович", weight: 1, gender: "male" },
  { value: "Даниловна", weight: 1, gender: "female" },
  { value: "Денисович", weight: 1, gender: "male" },
  { value: "Денисовна", weight: 1, gender: "female" },
  { value: "Дмитриевич", weight: 1, gender: "male" },
  { value: "Дмитриевна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
