import { describe, expect, it } from "vitest"
import { createJsonUsageStore, parseUsageFile } from "./store.ts"

describe("usage file", () => {
  it("читает контракт version 1 и выбрасывает чужие поля", () => {
    const file = parseUsageFile(
      JSON.stringify({
        version: 1,
        parts: { given: { алексей: 10, bad: 0 }, surname: { иванов: 2.5 }, extra: {} },
      }),
    )
    expect(file.parts.given).toEqual({ алексей: 10 })
    expect(file.parts.surname).toEqual({})
  })

  it("битый JSON не становится пустым документом для записи до commit", async () => {
    let disk = "{broken"
    const store = createJsonUsageStore({
      read: () => Promise.resolve(disk),
      write: (contents) => {
        disk = contents
        return Promise.resolve()
      },
      debounceMs: 1,
    })
    await store.ready()
    expect(store.get("given", "алексей")).toBe(0)
    expect(disk).toBe("{broken")
    store.increment("given", "алексей")
    await store.flush()
    expect(JSON.parse(disk)).toEqual({
      version: 1,
      parts: { surname: {}, given: { алексей: 1 }, patronymic: {} },
    })
  })

  it("два flush во время медленной записи не теряют commit между ними", async () => {
    let disk = ""
    const writes: string[] = []
    let releaseWrite: () => void = () => undefined
    const gate = new Promise<void>((resolve) => {
      releaseWrite = resolve
    })
    let markStarted: () => void = () => undefined
    const started = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    const store = createJsonUsageStore({
      read: () => Promise.resolve(""),
      write: (contents) => {
        writes.push(contents)
        disk = contents
        if (writes.length === 1) {
          markStarted()
          return gate
        }
        return Promise.resolve()
      },
      debounceMs: 10_000,
    })
    await store.ready()
    store.increment("given", "алексей")
    const flushing = store.flush()
    await started
    store.increment("given", "алексей")
    const second = store.flush()
    releaseWrite()
    await Promise.all([flushing, second])
    expect(writes).toHaveLength(2)
    expect(JSON.parse(disk)).toEqual({
      version: 1,
      parts: { surname: {}, given: { алексей: 2 }, patronymic: {} },
    })
  })

  it("после падения write следующий flush повторяет запись", async () => {
    let disk = ""
    let fail = true
    const store = createJsonUsageStore({
      read: () => Promise.resolve(""),
      write: (contents) => {
        if (fail) return Promise.reject(new Error("диск занят"))
        disk = contents
        return Promise.resolve()
      },
      debounceMs: 10_000,
    })
    await store.ready()
    store.increment("given", "мария")
    await expect(store.flush()).rejects.toThrow("диск занят")
    expect(disk).toBe("")
    fail = false
    store.increment("given", "мария")
    await store.flush()
    expect(JSON.parse(disk)).toEqual({
      version: 1,
      parts: { surname: {}, given: { мария: 2 }, patronymic: {} },
    })
  })

  it("ошибка чтения отклоняет ready и flush и не вызывает write", async () => {
    let writes = 0
    const store = createJsonUsageStore({
      read: () => Promise.reject(new Error("нет доступа")),
      write: () => {
        writes += 1
        return Promise.resolve()
      },
    })
    await expect(store.ready()).rejects.toThrow("нет доступа")
    store.increment("given", "алексей")
    await expect(store.flush()).rejects.toThrow("нет доступа")
    expect(writes).toBe(0)
    expect(store.get("given", "алексей")).toBe(1)
  })
})
