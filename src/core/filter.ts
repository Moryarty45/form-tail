import type { SuggestMode } from "./types.ts"

/** Русские буквы, дефис и оба апострофа. Цифры и латиница не проходят. */
const STRICT_CHAR = /[^\u0410-\u044f\u0401\u0451\-'\u2019]/gu

/**
 * Фильтр ввода. Не проверяет, есть ли слово в словаре:
 * неизвестная русская форма в строгом режиме допустима.
 */
export function filterInput(input: string, mode: SuggestMode): string {
  if (mode === "soft") return input
  return input.replace(STRICT_CHAR, "")
}
