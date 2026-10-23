import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Вадимович", weight: 1, gender: "male" },
  { value: "Вадимовна", weight: 1, gender: "female" },
  { value: "Васильевич", weight: 1, gender: "male" },
  { value: "Васильевна", weight: 1, gender: "female" },
  { value: "Викторович", weight: 1, gender: "male" },
  { value: "Викторовна", weight: 1, gender: "female" },
  { value: "Витальевич", weight: 1, gender: "male" },
  { value: "Витальевна", weight: 1, gender: "female" },
  { value: "Владимирович", weight: 1, gender: "male" },
  { value: "Владимировна", weight: 1, gender: "female" },
  { value: "Владиславович", weight: 1, gender: "male" },
  { value: "Владиславовна", weight: 1, gender: "female" },
  { value: "Вячеславович", weight: 1, gender: "male" },
  { value: "Вячеславовна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
