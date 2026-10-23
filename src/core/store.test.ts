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
})
