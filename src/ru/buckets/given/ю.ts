import type { LexiconEntry } from "../../../core/types.ts"

const entries = [
  { value: "Ювеналий", weight: 1, gender: "male" },
  { value: "Юдита", weight: 1, gender: "female" },
  { value: "Юдифь", weight: 1, gender: "female" },
  { value: "Юзефа", weight: 1, gender: "female" },
  { value: "Юлдуз", weight: 1, gender: "female" },
  { value: "Юлиан", weight: 1, gender: "male" },
  { value: "Юлиана", weight: 1, gender: "female" },
  { value: "Юлиания", weight: 1, gender: "female" },
  { value: "Юлий", weight: 1, gender: "male" },
  { value: "Юлиус", weight: 1, gender: "male" },
  { value: "Юлия", weight: 1, gender: "female" },
  { value: "Юна", weight: 1, gender: "female" },
  { value: "Юния", weight: 1, gender: "female" },
  { value: "Юнона", weight: 1, gender: "female" },
  { value: "Юрий", weight: 1, gender: "male" },
  { value: "Юрия", weight: 1, gender: "female" },
  { value: "Юстас", weight: 1, gender: "male" },
  { value: "Юстин", weight: 1, gender: "male" },
  { value: "Юстина", weight: 1, gender: "female" },
  { value: "Юханна", weight: 1, gender: "female" },
] as const satisfies readonly LexiconEntry[]

export default entries
