const YO = /ё/gu
const CYRILLIC = /^[а-яё]+$/u

/** Ключ сравнения и частот: нижний регистр, `ё` свёрнута в `е`, если включено. */
export function normalizeKey(value: string, foldYo: boolean): string {
  const lower = value.trim().toLocaleLowerCase("ru")
  return foldYo ? lower.replace(YO, "е") : lower
}

/** Первая буква корзины. `ё` всегда попадает в корзину `е`. */
export function bucketLetter(value: string): string | null {
  const key = normalizeKey(value, true)
  const letter = key[0]
  if (letter === undefined || !CYRILLIC.test(letter)) return null
  return letter
}

/**
 * Принятая форма имени: первая буква заглавная, остальные как в словаре.
 * Одна заглавная во вводе не означает, что всё слово набрано капсом.
 */
export function formatName(value: string): string {
  const first = value[0]
  if (first === undefined) return value
  return first.toLocaleUpperCase("ru") + value.slice(1).toLocaleLowerCase("ru")
}

/** Префикс сравнивается со словарной формой после одной и той же нормализации. */
export function matchesPrefix(
  input: string,
  canonical: string,
  foldYo: boolean,
): boolean {
  const prefix = normalizeKey(input, foldYo)
  if (prefix.length === 0) return false
  return normalizeKey(canonical, foldYo).startsWith(prefix)
}
