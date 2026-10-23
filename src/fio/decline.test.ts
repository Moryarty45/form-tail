import { describe, expect, it } from "vitest"
import { declineFio } from "./decline.ts"

describe("declineFio", () => {
  it("склоняет мужское ФИО", () => {
    const result = declineFio(
      { surname: "Иванов", given: "Иван", patronymic: "Иванович" },
      "male",
    )
    expect(result.cases.genitive.full).toBe("Иванова Ивана Ивановича")
    expect(result.cases.dative.full).toBe("Иванову Ивану Ивановичу")
    expect(result.cases.instrumental.full).toBe("Ивановым Иваном Ивановичем")
    expect(result.cases.prepositional.full).toBe("Иванове Иване Ивановиче")
  })

  it("склоняет женское ФИО и не добавляет предлог", () => {
    const result = declineFio(
      { surname: "Иванова", given: "Мария", patronymic: "Сергеевна" },
      "female",
    )
    expect(result.cases.dative.full).toBe("Ивановой Марии Сергеевне")
    expect(result.cases.prepositional.full).toBe("Ивановой Марии Сергеевне")
    expect(result.cases.instrumental.patronymic).toBe("Сергеевной")
  })

  it("не склоняет Шевченко и склоняет мужские имена на -а", () => {
    const result = declineFio(
      { surname: "Шевченко", given: "Никита", patronymic: "Петрович" },
      "male",
    )
    expect(result.cases.genitive.surname).toBe("Шевченко")
    expect(result.cases.genitive.given).toBe("Никиты")
    expect(result.cases.instrumental.given).toBe("Никитой")
  })

  it("склоняет каждую часть дефисного имени", () => {
    const result = declineFio({ given: "Анна-Мария" }, "female")
    expect(result.cases.dative.given).toBe("Анне-Марии")
  })

  it("не склоняет женскую форму фамилии как мужскую", () => {
    const result = declineFio({ surname: "Иванова", given: "Иван" }, "male")
    expect(result.cases.genitive.surname).toBe("Ивановой")
    expect(result.cases.genitive.given).toBe("Ивана")
  })

  it("склоняет исключения Лев, Пётр и Павел", () => {
    expect(declineFio({ given: "Лев" }, "male").cases.genitive.given).toBe("Льва")
    expect(declineFio({ given: "Лев" }, "male").cases.instrumental.given).toBe("Львом")
    expect(declineFio({ given: "Пётр" }, "male").cases.genitive.given).toBe("Петра")
    expect(declineFio({ given: "Пётр" }, "male").cases.prepositional.given).toBe("Петре")
    expect(declineFio({ given: "Павел" }, "male").cases.genitive.given).toBe("Павла")
    expect(declineFio({ given: "Павел" }, "male").cases.instrumental.given).toBe("Павлом")
  })

  it("склоняет фамилию-прилагательное и оставляет неизвестное окончание", () => {
    const result = declineFio({ surname: "Толстой", given: "Ким" }, "male")
    expect(result.cases.genitive.surname).toBe("Толстого")
    expect(result.cases.dative.surname).toBe("Толстому")
    expect(result.cases.genitive.given).toBe("Кима")
    expect(declineFio({ surname: "Дюма" }, "female").cases.genitive.surname).toBe("Дюма")
  })
})
