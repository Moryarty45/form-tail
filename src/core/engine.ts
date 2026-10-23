import { filterInput } from "./filter.ts"
import { findByPrefix } from "./lexicon.ts"
import { formatName, normalizeKey } from "./normalize.ts"
import { rankEntries } from "./rank.ts"
import type {
  LexiconEntry,
  NamePart,
  PartEngine,
  SuggestMode,
  SuggestOptions,
  Suggestion,
  UsageStore,
} from "./types.ts"

export interface CreatePartEngineOptions {
  part: NamePart
  entries: readonly LexiconEntry[]
  store: UsageStore
  mode: SuggestMode
  foldYo: boolean
  /** `false` — часть выключена: подсказки нет, частота не растёт. */
  enabled: boolean
}

function toSuggestion(input: string, entry: LexiconEntry): Suggestion {
  const value = formatName(entry.value)
  return { value, completion: value.slice(input.length), gender: entry.gender }
}

/**
 * Движок одной части. Не знает, фамилия это или город:
 * часть нужна только как ключ общего store.
 */
export function createPartEngine(options: CreatePartEngineOptions): PartEngine {
  const { part, entries, store, mode, foldYo, enabled } = options

  return {
    suggest(input, suggestOptions?: SuggestOptions): Suggestion | null {
      if (!enabled) return null
      const gender = suggestOptions?.gender
      const matches = findByPrefix(entries, input, foldYo).filter((entry) => {
        if (gender === undefined || gender === "unknown") return true
        return entry.gender === "unknown" || entry.gender === gender
      })
      const best = rankEntries(matches, (entry) =>
        store.get(part, normalizeKey(entry.value, foldYo)),
      )[0]
      if (best === undefined) return null
      return toSuggestion(input, best)
    },

    commit(value: string): void {
      if (!enabled) return
      const token = value.trim()
      if (token.length < 2 || /\s/u.test(token)) return
      store.increment(part, normalizeKey(token, foldYo))
    },

    filter(input: string): string {
      if (!enabled) return input
      return filterInput(input, mode)
    },
  }
}
