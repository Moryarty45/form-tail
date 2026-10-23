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
 */
export function createJsonUsageStore(options: JsonUsageStoreOptions): UsageStore & {
  /** Дожидается первого чтения. Повторный вызов безопасен. */
  ready: () => Promise<void>
} {
  const debounceMs = options.debounceMs ?? 300
  let file = EMPTY()
  let dirty = false
  let timer: ReturnType<typeof setTimeout> | undefined
  let writing: Promise<void> = Promise.resolve()

  const ready = options.read().then((raw) => {
    if (raw.trim().length > 0) file = parseUsageFile(raw)
  })

  async function persist(): Promise<void> {
    await ready
    if (!dirty) return
    dirty = false
    const snapshot = JSON.stringify(file)
    writing = options.write(snapshot)
    await writing
  }

  function schedule(): void {
    dirty = true
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
      schedule()
    },
    async flush() {
      if (timer !== undefined) {
        clearTimeout(timer)
        timer = undefined
      }
      await persist()
      await writing
    },
  }
}
