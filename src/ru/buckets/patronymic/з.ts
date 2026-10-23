import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Захарович", weight: 1, gender: "male" },
  { value: "Захаровна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
