import { normalizeKey } from "../core/normalize.ts"
import type { Gender, LexiconEntry } from "../core/types.ts"

const FEMALE_SURNAME = /(?:ова|ева|ёва|ина|ына|ая|яя)$/u
const MALE_SURNAME = /(?:ов|ев|ёв|ин|ын|ий|ый|ой)$/u
const MALE_PATRONYMIC = /(?:ович|евич|ич)$/u
const FEMALE_PATRONYMIC = /(?:овна|евна|ична|ычна)$/u

export type GenderSource = "explicit" | "given" | "patronymic" | "surname" | "none" | "conflict"

export interface ResolvedGender {
  gender: Gender
  source: GenderSource
}

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

/**
 * Род фамилии по окончанию, если более сильного сигнала нет.
 * Короткое или несклоняемое слово остаётся `unknown` и фильтр не включает.
 */
export function inferSurnameGender(input: string, foldYo: boolean): Gender {
  const key = normalizeKey(input, foldYo)
  if (key.length < 4) return "unknown"
  if (FEMALE_SURNAME.test(key)) return "female"
  if (MALE_SURNAME.test(key)) return "male"
  return "unknown"
}

export function inferPatronymicGender(input: string, foldYo: boolean): Gender {
  const key = normalizeKey(input, foldYo)
  if (MALE_PATRONYMIC.test(key)) return "male"
  if (FEMALE_PATRONYMIC.test(key)) return "female"
  return "unknown"
}

export function resolveGender(explicit: Gender | undefined, inferred: Gender): Gender {
  if (explicit !== undefined && explicit !== "unknown") return explicit
  return inferred
}

/**
 * Один порядок для подсказки и склонения.
 * Явный пол, имя, отчество, затем окончание фамилии.
 * Два сильных сигнала разного пола не выбирают победителя.
 */
export function resolveBundleGender(signals: {
  explicit?: Gender
  given: Gender
  patronymic: Gender
  surname: Gender
}): ResolvedGender {
  if (signals.explicit !== undefined && signals.explicit !== "unknown") {
    return { gender: signals.explicit, source: "explicit" }
  }
  const strong = [signals.given, signals.patronymic].filter(
    (gender): gender is Exclude<Gender, "unknown"> => gender !== "unknown",
  )
  const unique = new Set(strong)
  if (unique.size > 1) return { gender: "unknown", source: "conflict" }
  if (signals.given !== "unknown") return { gender: signals.given, source: "given" }
  if (signals.patronymic !== "unknown") return { gender: signals.patronymic, source: "patronymic" }
  if (signals.surname !== "unknown") return { gender: signals.surname, source: "surname" }
  return { gender: "unknown", source: "none" }
}
