import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Эдуардович", weight: 1, gender: "male" },
  { value: "Эдуардовна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
