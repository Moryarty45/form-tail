import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Макарович", weight: 1, gender: "male" },
  { value: "Макаровна", weight: 1, gender: "female" },
  { value: "Максимович", weight: 1, gender: "male" },
  { value: "Максимовна", weight: 1, gender: "female" },
  { value: "Маркович", weight: 1, gender: "male" },
  { value: "Марковна", weight: 1, gender: "female" },
  { value: "Матвеевич", weight: 1, gender: "male" },
  { value: "Матвеевна", weight: 1, gender: "female" },
  { value: "Мирославович", weight: 1, gender: "male" },
  { value: "Мирославовна", weight: 1, gender: "female" },
  { value: "Михаилович", weight: 1, gender: "male" },
  { value: "Михаиловна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
