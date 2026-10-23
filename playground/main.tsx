import { createFioSuggest, memoryUsageStore } from "../src/index.ts"
import { FormTailInput, useFioFields } from "../src/react/index.ts"
import { ruLexicons } from "../src/ru/index.ts"
import { useState } from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

const store = memoryUsageStore()
const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  store,
  lexicons: ruLexicons,
})

function Field({
  label,
  engine,
  value,
  onChange,
}: {
  label: string
  engine: ReturnType<typeof useFioFields>["given"]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label>
      {label}
      <FormTailInput
        aria-label={label}
        engine={engine}
        value={value}
        onChange={onChange}
        className="field"
        completionClassName="tail"
      />
    </label>
  )
}

function Playground() {
  const fields = useFioFields({ fio })
  const [surname, setSurname] = useState("")
  const [given, setGiven] = useState("")
  const [patronymic, setPatronymic] = useState("")
  const [saved, setSaved] = useState("")

  return (
    <main>
      <h1>form-tail</h1>
      <p>Tab или стрелка вправо принимают хвост. Escape прячет его. Латиница и цифры не вводятся.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
          setSaved([surname, given, patronymic].filter(Boolean).join(" "))
        }}
      >
        <Field
          label="Фамилия"
          engine={fields.surname}
          value={surname}
          onChange={(value) => {
            setSurname(value)
            fields.setSurname(value)
          }}
        />
        <Field
          label="Имя"
          engine={fields.given}
          value={given}
          onChange={(value) => {
            setGiven(value)
            fields.setGiven(value)
          }}
        />
        <Field
          label="Отчество"
          engine={fields.patronymic}
          value={patronymic}
          onChange={(value) => {
            setPatronymic(value)
            fields.setPatronymic(value)
          }}
        />
        <button type="submit">Запомнить</button>
      </form>
      <output>{saved}</output>
    </main>
  )
}

const root = document.querySelector("#root")
if (root === null) throw new Error("нет #root")
createRoot(root).render(<Playground />)
