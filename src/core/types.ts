/** Часть личного имени. Частоты частей не смешиваются. */
export type NamePart = "surname" | "given" | "patronymic"

/** Пол записи лексикона. `unknown` не режет кандидатов. */
export type Gender = "male" | "female" | "unknown"

/**
 * Режим ввода.
 * `strict` оставляет только русские буквы, дефис и апостроф.
 * `soft` не фильтрует. Подсказка в обоих режимах ищется по кириллическому префиксу.
 */
export type SuggestMode = "strict" | "soft"

/** Запись уже загруженной корзины. Ядро не знает, откуда она пришла. */
export interface LexiconEntry {
  /** Каноническое написание в именительном падеже. */
  value: string
  /** Больше — выше при равной личной частоте. */
  weight: number
  gender: Gender
}

/** Хвост, который ещё не записан в value поля. */
export interface Suggestion {
  /** Полное значение после принятия, в регистре ввода. */
  value: string
  /** Ненабранный хвост. Пустая строка, если ввод уже совпал со словом. */
  completion: string
  gender: Gender
}

export interface SuggestOptions {
  /** Явный пол сильнее пола, выведенного из соседнего поля. */
  gender?: Gender
}

/**
 * Счётчик принятых форм на всё приложение.
 * Владелец — хост: один экземпляр на процесс, без id формы и id поля.
 * Библиотека не пишет на диск и ничего не отправляет.
 */
export interface UsageStore {
  /** Ключ уже нормализован вызывающим кодом. */
  get(part: NamePart, key: string): number
  increment(part: NamePart, key: string): void
  /** Сбрасывает отложенную запись. У памяти — пустая операция. */
  flush(): Promise<void>
}

/** Подсказка одной части. Не знает про соседние поля. */
export interface PartEngine {
  /**
   * Лучший хвост для префикса. Ничего не записывает в store.
   * Пробел и некириллический префикс дают `null`.
   */
  suggest(input: string, options?: SuggestOptions): Suggestion | null
  /**
   * Увеличивает частоту принятого целого токена длиннее одной буквы.
   * Префикс, пустая строка и одна буква не считаются.
   */
  commit(value: string): void
  /** В `strict` выкидывает запрещённые символы, в том числе из вставки. */
  filter(input: string): string
}
