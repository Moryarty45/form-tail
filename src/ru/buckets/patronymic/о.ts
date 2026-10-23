import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Олегович", weight: 1, gender: "male" },
  { value: "Олеговна", weight: 1, gender: "female" },
  { value: "Остапович", weight: 1, gender: "male" },
] as const satisfies readonly LexiconEntry[]

export default entries
