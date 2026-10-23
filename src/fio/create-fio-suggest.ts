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
import { declineFio, type Declension } from "./decline.ts"
import {
  inferGender,
  inferPatronymicGender,
  inferSurnameGender,
  resolveBundleGender,
  type GenderSource,
} from "./gender.ts"

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
   * Пол по текущим значениям этой формы.
   * Явный пол сильнее имени, имя сильнее отчества, отчество сильнее окончания фамилии.
   */
  gender(values: FioContext & { gender?: Gender }): Promise<Gender>
  /**
   * Шесть падежей уже принятого ФИО для вставки в документ.
   * `null`, если пол не уверенный: библиотека падеж не угадывает.
   * Предлог не добавляет.
   */
  decline(values: FioContext & { gender?: Gender }): Promise<Declension | null>
}

/** Текущие соседние поля этой формы. На частоты не влияют. */
export interface FioContext {
  /** Текущая фамилия. Её окончание может задать пол, если имя и отчество молчат. */
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

export interface ResolvedFioGender {
  gender: Gender
  source: GenderSource
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

  async function genderOf(part: NamePart, input: string): Promise<Gender> {
    if (input.trim().length < 2) return "unknown"
    const entries = await load(part, input)
    const fromLexicon = inferGender(entries, input, foldYo)
    if (fromLexicon !== "unknown" || part !== "patronymic") return fromLexicon
    return inferPatronymicGender(input, foldYo)
  }

  async function resolve(values: FioContext & { gender?: Gender }): Promise<ResolvedFioGender> {
    const [given, patronymic] = await Promise.all([
      genderOf("given", values.given ?? ""),
      genderOf("patronymic", values.patronymic ?? ""),
    ])
    return resolveBundleGender({
      ...(values.gender === undefined ? {} : { explicit: values.gender }),
      given,
      patronymic,
      surname: inferSurnameGender(values.surname ?? "", foldYo),
    })
  }

  async function suggestPart(
    part: "given" | "patronymic",
    input: string,
    suggestOptions: (SuggestOptions & FioContext) | undefined,
  ): Promise<Suggestion | null> {
    const entries = await load(part, input)
    const resolved = await resolve({
      surname: suggestOptions?.surname ?? "",
      given: part === "given" ? input : (suggestOptions?.given ?? ""),
      patronymic: part === "patronymic" ? input : (suggestOptions?.patronymic ?? ""),
      ...(suggestOptions?.gender === undefined ? {} : { gender: suggestOptions.gender }),
    })
    return suggestWith(part, input, entries, resolved.gender)
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
      suggest: (input, suggestOptions) => suggestPart("given", input, suggestOptions),
      commit(value) {
        commitPart("given", value)
      },
      filter: (input) => filter("given", input),
    },
    patronymic: {
      suggest: (input, suggestOptions) => suggestPart("patronymic", input, suggestOptions),
      commit(value) {
        commitPart("patronymic", value)
      },
      filter: (input) => filter("patronymic", input),
    },
    async gender(values) {
      return (await resolve(values)).gender
    },
    async decline(values) {
      const resolved = await resolve(values)
      if (resolved.gender === "unknown") return null
      return declineFio(values, resolved.gender)
    },
  }
}
