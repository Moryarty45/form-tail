import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Цвета", weight: 1, gender: "female" },
  { value: "Цветана", weight: 1, gender: "female" },
  { value: "Целестина", weight: 1, gender: "female" },
  { value: "Цецилия", weight: 1, gender: "female" },
  { value: "Цэрэндорж", weight: 1, gender: "male" },
] as const satisfies readonly LexiconEntry[]

export default entries
