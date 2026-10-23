import { describe, expect, it } from "vitest"
import { createPartEngine } from "./engine.ts"
import { filterInput } from "./filter.ts"
import { findByPrefix } from "./lexicon.ts"
import { bucketLetter, formatName, normalizeKey } from "./normalize.ts"
import { memoryUsageStore } from "./store.ts"
import type { LexiconEntry } from "./types.ts"

const names: LexiconEntry[] = [
  { value: "Александр", weight: 10, gender: "male" },
  { value: "Алексей", weight: 8, gender: "male" },
  { value: "Алёна", weight: 6, gender: "female" },
  { value: "Анна-Мария", weight: 1, gender: "female" },
]

describe("normalize", () => {
  it("сворачивает ё и регистр в ключ", () => {
    expect(normalizeKey(" Алёна ", true)).toBe("алена")
    expect(normalizeKey("Алёна", false)).toBe("алёна")
  })

  it("кладёт ё в корзину е", () => {
    expect(bucketLetter("Ёлкин")).toBe("е")
    expect(bucketLetter("Aлексей")).toBeNull()
  })

  it("не считает одну заглавную капсом и пишет имя с заглавной", () => {
    expect(formatName("алексей")).toBe("Алексей")
    expect(formatName("АЛЕКСЕЙ")).toBe("Алексей")
    expect(formatName("Анна-Мария")).toBe("Анна-мария")
  })
})

describe("filter", () => {
  it("в строгом режиме оставляет русские буквы, дефис и апостроф", () => {
    expect(filterInput("Алек1сей Smith-О'Нил", "strict")).toBe("Алексей-О'Нил")
    expect(filterInput("Д’Арк", "strict")).toBe("Д’Арк")
  })

  it("в мягком режиме не трогает ввод", () => {
    expect(filterInput("Ivan 1", "soft")).toBe("Ivan 1")
  })
})

describe("lexicon", () => {
  it("находит префикс бинарным поиском и не режет по пробелу внутри токена", () => {
    const sorted = [...names].sort((left, right) =>
      normalizeKey(left.value, true).localeCompare(normalizeKey(right.value, true), "ru"),
    )
    expect(findByPrefix(sorted, "Але", true).map((entry) => entry.value)).toEqual([
      "Александр",
      "Алексей",
      "Алёна",
    ])
    expect(findByPrefix(sorted, "Але ", true)).toEqual([])
    expect(findByPrefix(sorted, "Алена", true).map((entry) => entry.value)).toEqual(["Алёна"])
  })
})

describe("engine", () => {
  const sorted = [...names].sort((left, right) =>
    normalizeKey(left.value, true).localeCompare(normalizeKey(right.value, true), "ru"),
  )

  it("ставит чаще использованное имя выше словарного веса", () => {
    const store = memoryUsageStore()
    const engine = createPartEngine({
      part: "given",
      entries: sorted,
      store,
      mode: "soft",
      foldYo: true,
      enabled: true,
    })
    expect(engine.suggest("А")?.completion).toBe("лександр")
    engine.commit("Алексей")
    for (let count = 0; count < 9; count += 1) engine.commit("Алексей")
    for (let count = 0; count < 3; count += 1) engine.commit("Александр")
    expect(engine.suggest("Алек")).toEqual({
      value: "Алексей",
      completion: "сей",
      gender: "male",
    })
  })

  it("не пишет частоту из suggest и не считает короткую форму", () => {
    const store = memoryUsageStore()
    const engine = createPartEngine({
      part: "given",
      entries: sorted,
      store,
      mode: "strict",
      foldYo: true,
      enabled: true,
    })
    engine.suggest("Алек")
    engine.commit("А")
    engine.commit("Алек сей")
    expect(store.get("given", "александр")).toBe(0)
    expect(store.get("given", "а")).toBe(0)
  })

  it("выключенная часть молчит и не фильтрует", () => {
    const store = memoryUsageStore()
    const engine = createPartEngine({
      part: "patronymic",
      entries: sorted,
      store,
      mode: "strict",
      foldYo: true,
      enabled: false,
    })
    expect(engine.suggest("Алек")).toBeNull()
    expect(engine.filter("Ivan")).toBe("Ivan")
    engine.commit("Алексей")
    expect(store.get("patronymic", "алексей")).toBe(0)
  })

  it("два движка с одним store видят одну частоту и не смешивают части", () => {
    const store = memoryUsageStore()
    const first = createPartEngine({
      part: "given",
      entries: sorted,
      store,
      mode: "soft",
      foldYo: true,
      enabled: true,
    })
    const second = createPartEngine({
      part: "given",
      entries: sorted,
      store,
      mode: "soft",
      foldYo: true,
      enabled: true,
    })
    const surname = createPartEngine({
      part: "surname",
      entries: sorted,
      store,
      mode: "soft",
      foldYo: true,
      enabled: true,
    })
    first.commit("Алексей")
    expect(second.suggest("Алек")?.value).toBe("Алексей")
    expect(surname.suggest("Алек")?.value).toBe("Александр")
  })

  it("отбрасывает противоположный пол", () => {
    const engine = createPartEngine({
      part: "given",
      entries: sorted,
      store: memoryUsageStore(),
      mode: "soft",
      foldYo: true,
      enabled: true,
    })
    expect(engine.suggest("Ал", { gender: "female" })?.value).toBe("Алёна")
  })
})
