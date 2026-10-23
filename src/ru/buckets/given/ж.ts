import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Жан", weight: 1, gender: "male" },
  { value: "Жанна", weight: 1, gender: "female" },
  { value: "Ждан", weight: 1, gender: "male" },
  { value: "Жеральдина", weight: 1, gender: "female" },
  { value: "Жером", weight: 1, gender: "male" },
  { value: "Жоан", weight: 1, gender: "male" },
  { value: "Жозефина", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
