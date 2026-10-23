import type { NamePart, UsageStore } from "./types.ts"

type PartCounts = Record<string, number>

export interface UsageFile {
  version: 1
  parts: Record<NamePart, PartCounts>
}

const EMPTY = (): UsageFile => ({
  version: 1,
  parts: { surname: {}, given: {}, patronymic: {} },
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/** Битый или чужой формат не становится источником записи. */
export function parseUsageFile(raw: string): UsageFile {
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.parts)) {
      return EMPTY()
    }
    const file = EMPTY()
    for (const part of ["surname", "given", "patronymic"] as const) {
      const counts = parsed.parts[part]
      if (!isRecord(counts)) continue
      for (const [key, count] of Object.entries(counts)) {
        if (typeof count === "number" && Number.isInteger(count) && count > 0) {
          file.parts[part][key] = count
        }
      }
    }
    return file
  } catch {
    return EMPTY()
  }
}

/** Память процесса. Для тестов и хоста, которому диск не нужен. */
export function memoryUsageStore(seed?: UsageFile): UsageStore {
  const file = seed ?? EMPTY()
  return {
    get(part, key) {
      return file.parts[part][key] ?? 0
    },
    increment(part, key) {
      file.parts[part][key] = (file.parts[part][key] ?? 0) + 1
    },
    flush() {
      return Promise.resolve()
    },
  }
}

export interface JsonUsageStoreOptions {
  /** Читает файл целиком. Отсутствие файла — пустая строка, не ошибка. */
  read: () => Promise<string>
  /**
   * Пишет уже сериализованный документ.
   * Хост обязан писать во временный файл и заменять им целевой,
   * чтобы обрыв записи не стёр частоты.
   */
  write: (contents: string) => Promise<void>
  /** Пауза перед записью после последнего commit. По умолчанию 300 мс. */
  debounceMs?: number
}

/**
 * JSON-адаптер без `fs` и Electron. Хост владеет путём: это должен быть user data,
 * не каталог установки.
 * Повторное чтение битого файла не затирает его, пока не случится новый commit.
 * Ошибка чтения отклоняет `ready` и `flush` и не планирует запись:
 * пустая память не должна затереть нечитаемый файл.
 */
export function createJsonUsageStore(options: JsonUsageStoreOptions): UsageStore & {
  /** Дожидается первого чтения. Повторный вызов возвращает тот же промис. */
  ready: () => Promise<void>
} {
  const debounceMs = options.debounceMs ?? 300
  let file = EMPTY()
  let generation = 0
  let persistedGeneration = 0
  let timer: ReturnType<typeof setTimeout> | undefined
  let queue: Promise<void> = Promise.resolve()
  let readError: Error | undefined

  const ready = options.read().then(
    (raw) => {
      if (raw.trim().length > 0) file = parseUsageFile(raw)
    },
    (error: unknown) => {
      readError = error instanceof Error ? error : new Error("не удалось прочитать файл частот")
      throw readError
    },
  )

  function snapshot(): string {
    return JSON.stringify(file)
  }

  function enqueue(run: () => Promise<void>): Promise<void> {
    const next = queue.then(run, run)
    queue = next.then(
      () => undefined,
      () => undefined,
    )
    return next
  }

  function persist(): Promise<void> {
    return enqueue(async () => {
      await ready
      while (generation !== persistedGeneration) {
        const writing = generation
        const contents = snapshot()
        await options.write(contents)
        persistedGeneration = writing
      }
    })
  }

  function schedule(): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = undefined
      void persist()
    }, debounceMs)
  }

  return {
    ready: () => ready,
    get(part, key) {
      return file.parts[part][key] ?? 0
    },
    increment(part, key) {
      file.parts[part][key] = (file.parts[part][key] ?? 0) + 1
      generation += 1
      if (readError !== undefined) return
      schedule()
    },
    async flush() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      if (readError !== undefined) throw readError
      await ready
      if (generation !== persistedGeneration) await persist()
      await queue
    },
  }
}
