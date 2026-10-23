import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Уве", weight: 1, gender: "male" },
  { value: "Уильям", weight: 1, gender: "male" },
  { value: "Улдис", weight: 1, gender: "male" },
  { value: "Улдуза", weight: 1, gender: "female" },
  { value: "Улита", weight: 1, gender: "female" },
  { value: "Ульрих", weight: 1, gender: "male" },
  { value: "Ульф", weight: 1, gender: "male" },
  { value: "Ульяна", weight: 1, gender: "female" },
  { value: "Умар", weight: 1, gender: "male" },
  { value: "Урбана", weight: 1, gender: "female" },
  { value: "Урсула", weight: 1, gender: "female" },
  { value: "Урызмаг", weight: 1, gender: "male" },
  { value: "Усама", weight: 1, gender: "male" },
  { value: "Усман", weight: 1, gender: "male" },
  { value: "Устина", weight: 1, gender: "female" },
  { value: "Устиния", weight: 1, gender: "female" },
  { value: "Устинья", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
