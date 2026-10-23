import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { useState } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { createPartEngine } from "../core/engine.ts"
import { memoryUsageStore } from "../core/store.ts"
import type { LexiconEntry } from "../core/types.ts"
import { createFioSuggest } from "../fio/create-fio-suggest.ts"
import { FormTailInput, useFioFields } from "./form-tail-input.tsx"

const entries: LexiconEntry[] = [
  { value: "Александр", weight: 10, gender: "male" },
  { value: "Алексей", weight: 4, gender: "male" },
]

function engine() {
  return createPartEngine({
    part: "given",
    entries,
    store: memoryUsageStore(),
    mode: "strict",
    foldYo: true,
    enabled: true,
  })
}

afterEach(() => {
  cleanup()
})

describe("FormTailInput", () => {
  it("по Tab дописывает хвост и не кладёт его в value раньше", async () => {
    const field = engine()
    render(<FormTailInput aria-label="Имя" engine={field} />)
    const input = screen.getByRole("textbox", { name: "Имя" })
    fireEvent.change(input, { target: { value: "Алек" } })
    expect(input).toHaveProperty("value", "Алек")
    expect(await screen.findByText("сандр")).toBeTruthy()
    fireEvent.keyDown(input, { key: "Tab" })
    expect(input).toHaveProperty("value", "Александр")
    expect(screen.queryByText("сандр")).toBeNull()
  })

  it("не принимает хвост стрелкой вправо, если курсор не в конце", async () => {
    render(<FormTailInput aria-label="Имя" engine={engine()} />)
    const input = screen.getByRole("textbox", { name: "Имя" })
    fireEvent.change(input, { target: { value: "Алек" } })
    await screen.findByText("сандр")
    if (!(input instanceof HTMLInputElement)) throw new Error("ожидался input")
    input.setSelectionRange(1, 1)
    fireEvent.keyDown(input, { key: "ArrowRight" })
    expect(input).toHaveProperty("value", "Алек")
  })

  it("Escape прячет хвост до следующего ввода", async () => {
    render(<FormTailInput aria-label="Имя" engine={engine()} />)
    const input = screen.getByRole("textbox", { name: "Имя" })
    fireEvent.change(input, { target: { value: "Алек" } })
    expect(await screen.findByText("сандр")).toBeTruthy()
    fireEvent.keyDown(input, { key: "Escape" })
    expect(screen.queryByText("сандр")).toBeNull()
    fireEvent.change(input, { target: { value: "Алекс" } })
    expect(await screen.findByText("андр")).toBeTruthy()
  })

  it("в строгом режиме не вставляет латиницу", () => {
    render(<FormTailInput aria-label="Имя" engine={engine()} />)
    const input = screen.getByRole("textbox", { name: "Имя" })
    fireEvent.change(input, { target: { value: "IvanАлек" } })
    expect(input).toHaveProperty("value", "Алек")
  })

  it("два поля делят commit через один store", async () => {
    const store = memoryUsageStore()
    const shared = {
      entries,
      store,
      mode: "soft" as const,
      foldYo: true,
      enabled: true,
    }
    const first = createPartEngine({ part: "given", ...shared })
    const second = createPartEngine({ part: "given", ...shared })
    const commit = vi.fn()

    function Pair() {
      const [left, setLeft] = useState("")
      return (
        <>
          <FormTailInput aria-label="Первое" engine={first} value={left} onChange={setLeft} />
          <FormTailInput aria-label="Второе" engine={second} onCommit={commit} />
        </>
      )
    }

    render(<Pair />)
    const firstInput = screen.getByRole("textbox", { name: "Первое" })
    fireEvent.change(firstInput, { target: { value: "Алексей" } })
    fireEvent.blur(firstInput)
    const secondInput = screen.getByRole("textbox", { name: "Второе" })
    fireEvent.change(secondInput, { target: { value: "Алек" } })
    expect(await screen.findByText("сей")).toBeTruthy()
  })

  it("blur коммитит последнюю строку, а не значение прошлого рендера", () => {
    const field = engine()
    const commit = vi.spyOn(field, "commit")
    render(<FormTailInput aria-label="Имя" engine={field} />)
    const input = screen.getByRole("textbox", { name: "Имя" })
    fireEvent.change(input, { target: { value: "Алексей" } })
    fireEvent.change(input, { target: { value: "Мария" } })
    fireEvent.blur(input)
    expect(commit).toHaveBeenCalledWith("Мария")
  })

  it("отказ suggest убирает хвост и не остаётся необработанным", async () => {
    const field = engine()
    vi.spyOn(field, "suggest").mockRejectedValue(new Error("корзина недоступна"))
    render(<FormTailInput aria-label="Имя" engine={field} />)
    fireEvent.change(screen.getByRole("textbox", { name: "Имя" }), { target: { value: "Алек" } })
    await Promise.resolve()
    expect(screen.queryByText("сандр")).toBeNull()
  })

  it("preventDefault хоста отменяет принятие хвоста", async () => {
    render(
      <FormTailInput
        aria-label="Имя"
        engine={engine()}
        onKeyDown={(event) => {
          event.preventDefault()
        }}
      />,
    )
    const input = screen.getByRole("textbox", { name: "Имя" })
    fireEvent.change(input, { target: { value: "Алек" } })
    await screen.findByText("сандр")
    fireEvent.keyDown(input, { key: "Tab" })
    expect(input).toHaveProperty("value", "Алек")
  })
})

describe("useFioFields", () => {
  it("видит имя в том же тике без setGiven", async () => {
    const fio = createFioSuggest({
      locale: "ru",
      lexicons: {
        load(_part, letter) {
          const pool = [
            { value: "Мария", weight: 2, gender: "female" as const },
            { value: "Иванович", weight: 2, gender: "male" as const },
            { value: "Ивановна", weight: 2, gender: "female" as const },
          ]
          return Promise.resolve(pool.filter((entry) => entry.value.toLocaleLowerCase("ru").startsWith(letter)))
        },
      },
    })

    function Form() {
      const fields = useFioFields({ fio })
      return (
        <>
          <FormTailInput aria-label="Имя" engine={fields.given} />
          <FormTailInput aria-label="Отчество" engine={fields.patronymic} />
        </>
      )
    }

    render(<Form />)
    fireEvent.change(screen.getByRole("textbox", { name: "Имя" }), { target: { value: "Мария" } })
    fireEvent.change(screen.getByRole("textbox", { name: "Отчество" }), { target: { value: "Иван" } })
    expect(await screen.findByText("овна")).toBeTruthy()
    expect(screen.queryByText("ович")).toBeNull()
  })
})
