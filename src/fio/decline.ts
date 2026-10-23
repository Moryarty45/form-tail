import type { Gender } from "../core/types.ts"

/** Падеж единственного числа. Предлог в результат не входит. */
export type GrammaticalCase =
  | "nominative"
  | "genitive"
  | "dative"
  | "accusative"
  | "instrumental"
  | "prepositional"

export const GRAMMATICAL_CASES = [
  "nominative",
  "genitive",
  "dative",
  "accusative",
  "instrumental",
  "prepositional",
] as const satisfies readonly GrammaticalCase[]

export interface DeclinedName {
  surname: string
  given: string
  patronymic: string
  /** Фамилия, имя и отчество через пробел. Пустые части опущены. Предлога нет. */
  full: string
}

export interface Declension {
  gender: Exclude<Gender, "unknown">
  cases: Record<GrammaticalCase, DeclinedName>
}

type PersonGender = Exclude<Gender, "unknown">
type Mod = readonly [string, string, string, string, string]

const INDECLINABLE_SURNAME = /(?:енко|ко|ых|их|ово|аго|[еёиоуыэю])$/u
const FEMININE_SURNAME = /(?:ова|ева|ёва|ина|ына)$/u
const ADJECTIVE_SURNAME = /(?:ая|яя|ий|ый|ой)$/u
const SIBILANT = /[жчшщ]$/u

function fold(value: string): string {
  return value.toLocaleLowerCase("ru").replace(/ё/gu, "е")
}

function stem(value: string, cut: number): string {
  return value.slice(0, Math.max(0, value.length - cut))
}

function surnameMod(value: string, gender: PersonGender): Mod | null {
  const key = fold(value)
  if (INDECLINABLE_SURNAME.test(key) && !ADJECTIVE_SURNAME.test(key) && !FEMININE_SURNAME.test(key)) {
    return null
  }
  if (/(?:ова|ева|ёва|ина|ына)$/u.test(key)) return ["ой", "ой", "у", "ой", "ой"]
  if (/ая$/u.test(key)) return ["ой", "ой", "ую", "ой", "ой"]
  if (/яя$/u.test(key)) return ["ей", "ей", "юю", "ей", "ей"]
  if (/(?:ий|ый)$/u.test(key)) return ["ого", "ому", "ого", "ым", "ом"]
  if (/ой$/u.test(key)) return ["ого", "ому", "ого", "ым", "ом"]
  if (gender === "female") return null
  if (/(?:ов|ев|ёв|ин|ын)$/u.test(key)) return ["а", "у", "а", "ым", "е"]
  return null
}

function givenMod(value: string, gender: PersonGender): Mod | null {
  const key = fold(value)
  if (key === "лев") return ["ьва", "ьву", "ьва", "ьвом", "ьве"]
  if (key === "петр") return ["етра", "етру", "етра", "етром", "етре"]
  if (key === "павел") return ["ла", "лу", "ла", "лом", "ле"]
  if (key === "илья") return ["и", "е", "ю", "ёй", "е"]
  if (/[еёиоуыэю]$/u.test(key)) return null
  if (gender === "female" && /ь$/u.test(key)) return ["и", "и", "", "ю", "и"]
  if (/ия$/u.test(key)) return ["и", "и", "ю", "ей", "и"]
  if (/я$/u.test(key)) return ["и", "е", "ю", "ей", "е"]
  if (/[гкхжчшщ]а$/u.test(key)) return ["и", "е", "у", "ой", "е"]
  if (/а$/u.test(key)) return ["ы", "е", "у", "ой", "е"]
  if (gender === "female") return null
  if (/ий$/u.test(key)) return ["я", "ю", "я", "ем", "и"]
  if (/й$/u.test(key)) return ["я", "ю", "я", "ем", "е"]
  if (/ь$/u.test(key)) return ["я", "ю", "я", "ем", "е"]
  if (SIBILANT.test(key)) return ["а", "у", "а", "ем", "е"]
  return ["а", "у", "а", "ом", "е"]
}

function patronymicMod(value: string): Mod | null {
  const key = fold(value)
  if (/ич$/u.test(key)) return ["а", "у", "а", "ем", "е"]
  if (/на$/u.test(key)) return ["ы", "е", "у", "ой", "е"]
  return null
}

function declinePart(
  value: string,
  kind: "surname" | "given" | "patronymic",
  gender: PersonGender,
  grammaticalCase: GrammaticalCase,
): string {
  return value
    .split("-")
    .map((part) => {
      if (grammaticalCase === "nominative" || part.length === 0) return part
      const mod =
        kind === "surname"
          ? surnameMod(part, gender)
          : kind === "given"
            ? givenMod(part, gender)
            : patronymicMod(part)
      const cut = /^(?:лев|петр|павел)$/u.test(fold(part))
        ? 2
        : /[аяьй]$/u.test(fold(part))
          ? 1
          : 0
      if (mod === null) return part
      const ending = mod[GRAMMATICAL_CASES.indexOf(grammaticalCase) - 1]
      return ending === undefined ? part : stem(part, cut) + ending
    })
    .join("-")
}

function joinName(parts: readonly string[]): string {
  return parts.map((part) => part.trim()).filter((part) => part.length > 0).join(" ")
}

/**
 * Склоняет уже принятые части по собственным правилам.
 * Неуверенный пол сюда не передаётся: вызывающий код сам решает, что делать с `null`.
 */
export function declineFio(
  values: { surname?: string; given?: string; patronymic?: string },
  gender: PersonGender,
): Declension {
  const surname = values.surname ?? ""
  const given = values.given ?? ""
  const patronymic = values.patronymic ?? ""
  const cases = Object.fromEntries(
    GRAMMATICAL_CASES.map((grammaticalCase) => {
      const declined = {
        surname: declinePart(surname, "surname", gender, grammaticalCase),
        given: declinePart(given, "given", gender, grammaticalCase),
        patronymic: declinePart(patronymic, "patronymic", gender, grammaticalCase),
      }
      return [grammaticalCase, { ...declined, full: joinName([declined.surname, declined.given, declined.patronymic]) }]
    }),
  ) as Record<GrammaticalCase, DeclinedName>
  return { gender, cases }
}
