import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Шалом", weight: 1, gender: "male" },
  { value: "Шамиль", weight: 1, gender: "male" },
  { value: "Шамсуддин", weight: 1, gender: "male" },
  { value: "Шангуль", weight: 1, gender: "female" },
  { value: "Шапур", weight: 1, gender: "male" },
  { value: "Шарлотта", weight: 1, gender: "female" },
  { value: "Шарль", weight: 1, gender: "male" },
  { value: "Шейх-Хайдар", weight: 1, gender: "male" },
  { value: "Ширин", weight: 1, gender: "female" },
  { value: "Шон", weight: 1, gender: "male" },
  { value: "Шушаника", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
