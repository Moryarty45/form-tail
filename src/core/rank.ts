import type { LexiconEntry } from "./types.ts"

/** Личная частота, затем вес словаря, затем алфавит. Без скрытых коэффициентов. */
export function compareEntries(
  left: LexiconEntry,
  right: LexiconEntry,
  usage: (entry: LexiconEntry) => number,
): number {
  const byUsage = usage(right) - usage(left)
  if (byUsage !== 0) return byUsage
  const byWeight = right.weight - left.weight
  if (byWeight !== 0) return byWeight
  return left.value.localeCompare(right.value, "ru")
}

export function rankEntries(
  entries: readonly LexiconEntry[],
  usage: (entry: LexiconEntry) => number,
): LexiconEntry[] {
  return [...entries].sort((left, right) => compareEntries(left, right, usage))
}
