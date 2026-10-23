import { describe, expect, it } from "vitest"
import { normalizeKey } from "../core/normalize.ts"
import { memoryUsageStore } from "../core/store.ts"
import type { LexiconEntry, NamePart } from "../core/types.ts"
import { createFioSuggest } from "./create-fio-suggest.ts"
import { inferGender } from "./gender.ts"

const given: LexiconEntry[] = [
  { value: "Александр", weight: 10, gender: "male" },
  { value: "Алексей", weight: 5, gender: "male" },
  { value: "Алёна", weight: 4, gender: "female" },
  { value: "Женя", weight: 3, gender: "unknown" },
  { value: "Максим", weight: 7, gender: "male" },
  { value: "Мария", weight: 8, gender: "female" },
]

const patronymic: LexiconEntry[] = [
  { value: "Иванович", weight: 5, gender: "male" },
  { value: "Ивановна", weight: 5, gender: "female" },
  { value: "Алексеевич", weight: 4, gender: "male" },
  { value: "Алексеевна", weight: 4, gender: "female" },
]

function source(loaded: string[] = []) {
  return {
    loaded,
    load(part: NamePart, letter: string) {
      loaded.push(`${part}:${letter}`)
      const pool = part === "patronymic" ? patronymic : part === "given" ? given : []
      return Promise.resolve(
        pool
          .filter((entry) => normalizeKey(entry.value, true).startsWith(letter))
          .sort((left, right) =>
            normalizeKey(left.value, true).localeCompare(normalizeKey(right.value, true), "ru"),
          ),
      )
    },
  }
}

describe("gender", () => {
  it("не режет неоднозначное имя", () => {
    expect(inferGender([{ value: "Женя", weight: 1, gender: "unknown" }], "Женя", true)).toBe(
      "unknown",
    )
  })
})

describe("createFioSuggest", () => {
  it("грузит только корзину набранной буквы и сворачивает ё", async () => {
    const lexicons = source()
    const fio = createFioSuggest({ locale: "ru", lexicons })
    expect((await fio.given.suggest("Алё"))?.value).toBe("Александр")
    expect(lexicons.loaded).toEqual(["given:а"])
    await fio.given.suggest("Алек")
    expect(lexicons.loaded).toEqual(["given:а"])
  })

  it("мужское имя не даёт женское отчество, Женя не режет", async () => {
    const fio = createFioSuggest({ locale: "ru", lexicons: source() })
    expect((await fio.patronymic.suggest("Иван", { given: "Алексей" }))?.value).toBe("Иванович")
    expect((await fio.patronymic.suggest("Иван", { given: "Женя" }))?.value).toBe("Иванович")
    expect((await fio.patronymic.suggest("Иван", { gender: "female" }))?.value).toBe("Ивановна")
  })

  it("женская фамилия не предлагает мужское имя", async () => {
    const fio = createFioSuggest({ locale: "ru", lexicons: source() })
    expect((await fio.given.suggest("Макс", { surname: "Иванова" }))?.value).not.toBe("Максим")
    expect((await fio.surname.suggest("Иван"))?.value).toBeUndefined()
  })

  it("выключенная часть молчит", async () => {
    const store = memoryUsageStore()
    const fio = createFioSuggest({
      locale: "ru",
      mode: "strict",
      parts: { surname: true, given: true, patronymic: false },
      store,
      lexicons: source(),
    })
    expect(await fio.patronymic.suggest("Иван", { given: "Алексей" })).toBeNull()
    fio.patronymic.commit("Иванович")
    expect(store.get("patronymic", "иванович")).toBe(0)
    expect(fio.given.filter("Иван1")).toBe("Иван")
    expect(fio.patronymic.filter("Иван1")).toBe("Иван1")
  })

  it("два фасада делят store и не смешивают части", async () => {
    const store = memoryUsageStore()
    const first = createFioSuggest({ locale: "ru", store, lexicons: source() })
    const second = createFioSuggest({ locale: "ru", store, lexicons: source() })
    first.given.commit("Алексей")
    expect((await second.given.suggest("Алек"))?.completion).toBe("сей")
    expect(await second.surname.suggest("Алек")).toBeNull()
  })

  it("конфликт имени и отчества не выбирает пол и не склоняет", async () => {
    const fio = createFioSuggest({ locale: "ru", lexicons: source() })
    expect(await fio.gender({ given: "Алексей", patronymic: "Ивановна", surname: "Иванова" })).toBe(
      "unknown",
    )
    expect((await fio.patronymic.suggest("Иван", { given: "Алексей" }))?.value).toBe("Иванович")
    expect(
      await fio.decline({ surname: "Иванова", given: "Алексей", patronymic: "Ивановна" }),
    ).toBeNull()
  })

  it("уверенная связка склоняется, неполная без пола не склоняется", async () => {
    const fio = createFioSuggest({ locale: "ru", lexicons: source() })
    const declined = await fio.decline({
      surname: "Иванова",
      given: "Мария",
      patronymic: "Сергеевна",
    })
    expect(declined?.cases.dative.full).toBe("Ивановой Марии Сергеевне")
    expect(await fio.decline({ surname: "Шевченко" })).toBeNull()
  })
})
