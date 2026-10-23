import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Юлианович", weight: 1, gender: "male" },
  { value: "Юрьевич", weight: 1, gender: "male" },
  { value: "Юрьевна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
