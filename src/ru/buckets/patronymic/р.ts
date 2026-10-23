import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Ренатович", weight: 1, gender: "male" },
  { value: "Родионович", weight: 1, gender: "male" },
  { value: "Родионовна", weight: 1, gender: "female" },
  { value: "Романович", weight: 1, gender: "male" },
  { value: "Романовна", weight: 1, gender: "female" },
  { value: "Русланович", weight: 1, gender: "male" },
  { value: "Руслановна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
