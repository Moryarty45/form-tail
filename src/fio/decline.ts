import type { Gender } from "../core/types.ts"

/**
 * Таблица окончаний основана на публичных правилах Petrovich
 * и сужена до контракта form-tail: неизвестное окончание не склоняется.
 * Ударение и пол здесь не угадываются.
 */

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
/** Родительный, дательный, винительный, творительный, предложный. */
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

function apply(value: string, mod: Mod | null, cut: number, grammaticalCase: GrammaticalCase): string {
  if (grammaticalCase === "nominative" || mod === null) return value
  const ending = mod[GRAMMATICAL_CASES.indexOf(grammaticalCase) - 1]
  return ending === undefined ? value : stem(value, cut) + ending
}

function surnameMod(value: string, gender: PersonGender): { mod: Mod; cut: number } | null {
  const key = fold(value)
  if (INDECLINABLE_SURNAME.test(key) && !ADJECTIVE_SURNAME.test(key) && !FEMININE_SURNAME.test(key)) {
    return null
  }
  if (/(?:ова|ева|ёва|ина|ына)$/u.test(key)) return { cut: 1, mod: ["ой", "ой", "у", "ой", "ой"] }
  if (key.endsWith("ая")) return { cut: 1, mod: ["ой", "ой", "ую", "ой", "ой"] }
  if (key.endsWith("яя")) return { cut: 1, mod: ["ей", "ей", "юю", "ей", "ей"] }
  if (/(?:ий|ый|ой)$/u.test(key)) return { cut: 2, mod: ["ого", "ому", "ого", "ым", "ом"] }
  if (gender === "female") return null
  if (/(?:ов|ев|ёв|ин|ын)$/u.test(key)) return { cut: 0, mod: ["а", "у", "а", "ым", "е"] }
  return null
}

function givenMod(value: string, gender: PersonGender): { mod: Mod; cut: number } | null {
  const key = fold(value)
  if (key === "лев") return { cut: 2, mod: ["ьва", "ьву", "ьва", "ьвом", "ьве"] }
  if (key === "петр") return { cut: value.length, mod: ["петра", "петру", "петра", "петром", "петре"] }
  if (key === "павел") return { cut: 2, mod: ["ла", "лу", "ла", "лом", "ле"] }
  if (key === "илья") return { cut: 1, mod: ["и", "е", "ю", "ёй", "е"] }
  if (/[еёиоуыэю]$/u.test(key)) return null
  if (gender === "female" && key.endsWith("ь")) return { cut: 1, mod: ["и", "и", "", "ю", "и"] }
  if (key.endsWith("ия")) return { cut: 1, mod: ["и", "и", "ю", "ей", "и"] }
  if (key.endsWith("я")) return { cut: 1, mod: ["и", "е", "ю", "ей", "е"] }
  if (/[гкхжчшщ]а$/u.test(key)) return { cut: 1, mod: ["и", "е", "у", "ой", "е"] }
  if (key.endsWith("а")) return { cut: 1, mod: ["ы", "е", "у", "ой", "е"] }
  if (gender === "female") return null
  if (key.endsWith("ий")) return { cut: 1, mod: ["я", "ю", "я", "ем", "и"] }
  if (key.endsWith("й")) return { cut: 1, mod: ["я", "ю", "я", "ем", "е"] }
  if (key.endsWith("ь")) return { cut: 1, mod: ["я", "ю", "я", "ем", "е"] }
  if (SIBILANT.test(key)) return { cut: 0, mod: ["а", "у", "а", "ем", "е"] }
  return { cut: 0, mod: ["а", "у", "а", "ом", "е"] }
}

function patronymicMod(value: string): { mod: Mod; cut: number } | null {
  const key = fold(value)
  if (key.endsWith("ич")) return { cut: 0, mod: ["а", "у", "а", "ем", "е"] }
  if (key.endsWith("на")) return { cut: 1, mod: ["ы", "е", "у", "ой", "е"] }
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
      if (part.length === 0) return part
      const rule =
        kind === "surname"
          ? surnameMod(part, gender)
          : kind === "given"
            ? givenMod(part, gender)
            : patronymicMod(part)
      if (rule === null) return part
      const next = apply(part, rule.mod, rule.cut, grammaticalCase)
      if (fold(part) !== "петр") return next
      const first = part[0]
      return first === undefined ? next : first.toLocaleUpperCase("ru") + next.slice(1)
    })
    .join("-")
}

function joinName(parts: readonly string[]): string {
  return parts.map((part) => part.trim()).filter((part) => part.length > 0).join(" ")
}

/**
 * Склоняет уже принятые части по таблице правил.
 * Неуверенный пол сюда не передаётся: вызывающий код сам решает, что делать с `null`.
 * Окончание вне таблицы возвращается без изменений.
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
