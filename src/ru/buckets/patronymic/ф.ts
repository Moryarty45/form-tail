import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Федорович", weight: 1, gender: "male" },
  { value: "Федоровна", weight: 1, gender: "female" },
  { value: "Филиппович", weight: 1, gender: "male" },
  { value: "Филипповна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
