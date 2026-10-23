import { bucketLetter, formatName, normalizeKey } from "../core/normalize.ts"
import { filterInput } from "../core/filter.ts"
import { createPartEngine } from "../core/engine.ts"
import { memoryUsageStore } from "../core/store.ts"
import type {
  Gender,
  LexiconEntry,
  NamePart,
  SuggestMode,
  SuggestOptions,
  Suggestion,
  UsageStore,
} from "../core/types.ts"
import { inferGender, inferSurnameGender, resolveGender } from "./gender.ts"

/** Загружает одну буквенную корзину. Пустая буква — пустой список, не ошибка. */
export interface LexiconSource {
  load(part: NamePart, letter: string): Promise<readonly LexiconEntry[]>
}

export interface CreateFioSuggestOptions {
  /** Сейчас поддерживается только `ru`. Поле нужно, чтобы следующий пресет не ломал вызов. */
  locale: "ru"
  mode?: SuggestMode
  /** Выключенная часть не индексируется и не отвечает. По умолчанию включены все. */
  parts?: Partial<Record<NamePart, boolean>>
  /** Сравнивать `е` и `ё` как одну букву. По умолчанию включено. */
  foldYo?: boolean
  /**
   * Один store на приложение. Если не передан, частоты живут только в этом экземпляре
   * и пропадают вместе с процессом.
   */
  store?: UsageStore
  lexicons: LexiconSource
}

/** Фасад трёх независимых частей. Поле не рисует. */
export interface FioSuggest {
  surname: FioPart
  given: FioPart
  patronymic: FioPart
  /**
   * Пол по текущим значениям имени и отчества этой формы.
   * Фамилия в выводе не участвует.
   */
  gender(values: { given?: string; patronymic?: string }): Promise<Gender>
}

/** Текущие соседние поля этой формы. На частоты не влияют. */
export interface FioContext {
  /** Текущая фамилия. Её окончание может задать пол имени и отчества. */
  surname?: string
  /** Текущее имя. Нужно отчеству, чтобы отсечь чужой пол. */
  given?: string
  /** Текущее отчество. Нужно имени для той же связки. */
  patronymic?: string
}

export interface FioPart {
  /**
   * Лучший хвост. Явный `options.gender` перекрывает связку соседних полей.
   * Ничего не записывает в store.
   */
  suggest(input: string, options?: SuggestOptions & FioContext): Promise<Suggestion | null>
  /** Увеличивает общий счётчик принятого токена длиннее одной буквы. */
  commit(value: string): void
  /** В строгом режиме выкидывает нерусские символы. Выключенная часть не фильтрует. */
  filter(input: string): string
}

/**
 * Пресет ФИО поверх ядра.
 * Корзина грузится по первой букве и кэшируется на этот экземпляр.
 */
export function createFioSuggest(options: CreateFioSuggestOptions): FioSuggest {
  const mode = options.mode ?? "soft"
  const foldYo = options.foldYo ?? true
  const store = options.store ?? memoryUsageStore()
  const enabled: Record<NamePart, boolean> = {
    surname: options.parts?.surname ?? true,
    given: options.parts?.given ?? true,
    patronymic: options.parts?.patronymic ?? true,
  }
  const cache = new Map<string, Promise<readonly LexiconEntry[]>>()

  function load(part: NamePart, input: string): Promise<readonly LexiconEntry[]> {
    const letter = bucketLetter(input)
    if (!enabled[part] || letter === null) return Promise.resolve([])
    const key = `${part}:${letter}`
    const cached = cache.get(key)
    if (cached !== undefined) return cached
    const pending = options.lexicons.load(part, letter).catch((error: unknown) => {
      cache.delete(key)
      throw error
    })
    cache.set(key, pending)
    return pending
  }

  function suggestWith(
    part: NamePart,
    input: string,
    entries: readonly LexiconEntry[],
    gender: Gender,
  ): Suggestion | null {
    return createPartEngine({
      part,
      entries,
      store,
      mode,
      foldYo,
      enabled: true,
    }).suggest(input, gender === "unknown" ? undefined : { gender })
  }

  function commitPart(part: NamePart, value: string): void {
    if (!enabled[part]) return
    const token = value.trim()
    if (token.length < 2 || /\s/u.test(token)) return
    store.increment(part, normalizeKey(token, foldYo))
  }

  function filter(part: NamePart, input: string): string {
    if (!enabled[part]) return input
    return formatName(filterInput(input, mode))
  }

  return {
    surname: {
      async suggest(input) {
        return suggestWith("surname", input, await load("surname", input), "unknown")
      },
      commit(value) {
        commitPart("surname", value)
      },
      filter: (input) => filter("surname", input),
    },
    given: {
      async suggest(input, suggestOptions) {
        const [entries, sibling] = await Promise.all([
          load("given", input),
          genderOf("patronymic", suggestOptions?.patronymic ?? ""),
        ])
        const surnameGender = inferSurnameGender(suggestOptions?.surname ?? "", foldYo)
        const gender = resolveGender(
          suggestOptions?.gender,
          surnameGender !== "unknown"
            ? surnameGender
            : sibling !== "unknown"
              ? sibling
              : inferGender(entries, input, foldYo),
        )
        return suggestWith("given", input, entries, gender)
      },
      commit(value) {
        commitPart("given", value)
      },
      filter: (input) => filter("given", input),
    },
    patronymic: {
      async suggest(input, suggestOptions) {
        const [entries, sibling] = await Promise.all([
          load("patronymic", input),
          genderOf("given", suggestOptions?.given ?? ""),
        ])
        const surnameGender = inferSurnameGender(suggestOptions?.surname ?? "", foldYo)
        const gender = resolveGender(
          suggestOptions?.gender,
          sibling !== "unknown" ? sibling : surnameGender,
        )
        return suggestWith("patronymic", input, entries, gender)
      },
      commit(value) {
        commitPart("patronymic", value)
      },
      filter: (input) => filter("patronymic", input),
    },
    async gender(values) {
      const [fromGiven, fromPatronymic] = await Promise.all([
        genderOf("given", values.given ?? ""),
        genderOf("patronymic", values.patronymic ?? ""),
      ])
      if (fromGiven !== "unknown") return fromGiven
      return fromPatronymic
    },
  }

  async function genderOf(part: NamePart, input: string): Promise<Gender> {
    if (input.trim().length < 2) return "unknown"
    return inferGender(await load(part, input), input, foldYo)
  }
}
