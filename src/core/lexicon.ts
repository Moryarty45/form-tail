import { matchesPrefix, normalizeKey } from "./normalize.ts"
import type { LexiconEntry } from "./types.ts"

/**
 * Бинарный поиск начала префикса в корзине, отсортированной по нормализованному ключу.
 * Корзина должна быть уже загружена вызывающим кодом.
 */
export function findByPrefix(
  entries: readonly LexiconEntry[],
  prefix: string,
  foldYo: boolean,
): LexiconEntry[] {
  const key = normalizeKey(prefix, foldYo)
  if (key.length === 0 || /\s/u.test(prefix)) return []

  let low = 0
  let high = entries.length
  while (low < high) {
    const mid = (low + high) >>> 1
    const entry = entries[mid]
    if (entry === undefined) break
    const entryKey = normalizeKey(entry.value, foldYo)
    if (entryKey < key) low = mid + 1
    else high = mid
  }

  const found: LexiconEntry[] = []
  for (let index = low; index < entries.length; index += 1) {
    const entry = entries[index]
    if (entry === undefined || !matchesPrefix(prefix, entry.value, foldYo)) break
    found.push(entry)
  }
  return found
}
