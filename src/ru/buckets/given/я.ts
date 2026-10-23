import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Ядвига", weight: 1, gender: "female" },
  { value: "Яков", weight: 1, gender: "male" },
  { value: "Якуб", weight: 1, gender: "male" },
  { value: "Якун", weight: 1, gender: "male" },
  { value: "Ян", weight: 1, gender: "male" },
  { value: "Яна", weight: 1, gender: "female" },
  { value: "Яни", weight: 1, gender: "male" },
  { value: "Янина", weight: 1, gender: "female" },
  { value: "Янита", weight: 1, gender: "female" },
  { value: "Янка", weight: 1, gender: "female" },
  { value: "Янсылу", weight: 1, gender: "female" },
  { value: "Януарий", weight: 1, gender: "male" },
  { value: "Яромир", weight: 1, gender: "male" },
  { value: "Ярополк", weight: 1, gender: "male" },
  { value: "Ярослав", weight: 1, gender: "male" },
  { value: "Ярослава", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
