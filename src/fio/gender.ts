import { normalizeKey } from "../core/normalize.ts"
import type { Gender, LexiconEntry } from "../core/types.ts"

/**
 * Уверенный пол по уже введённым частям этой формы.
 * Неоднозначная форма (`Женя`) и пустой ввод не включают фильтр.
 * Файл частот здесь не читается.
 */
export function inferGender(
  entries: readonly LexiconEntry[],
  input: string,
  foldYo: boolean,
): Gender {
  const key = normalizeKey(input, foldYo)
  if (key.length < 2) return "unknown"
  const exact = entries.filter(
    (entry) => normalizeKey(entry.value, foldYo) === key && entry.gender !== "unknown",
  )
  const genders = new Set(exact.map((entry) => entry.gender))
  if (genders.size !== 1) return "unknown"
  return exact[0]?.gender ?? "unknown"
}

const FEMALE_SURNAME = /(?:ова|ева|ёва|ина|ына|ая|яя)$/u
const MALE_SURNAME = /(?:ов|ев|ёв|ин|ын|ий|ый|ой)$/u

/**
 * Род фамилии по окончанию, если словарь его не зафиксировал.
 * Короткое или несклоняемое слово остаётся `unknown` и фильтр не включает.
 */
export function inferSurnameGender(input: string, foldYo: boolean): Gender {
  const key = normalizeKey(input, foldYo)
  if (key.length < 4) return "unknown"
  if (FEMALE_SURNAME.test(key)) return "female"
  if (MALE_SURNAME.test(key)) return "male"
  return "unknown"
}
export function resolveGender(explicit: Gender | undefined, inferred: Gender): Gender {
  if (explicit !== undefined && explicit !== "unknown") return explicit
  return inferred
}
