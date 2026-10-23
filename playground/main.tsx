import { createFioSuggest, memoryUsageStore, type Declension } from "../src/index.ts"
import { FormTailInput, useFioFields } from "../src/react/index.ts"
import { ruLexicons } from "../src/ru/index.ts"
import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import "./styles.css"

const store = memoryUsageStore()
const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  store,
  lexicons: ruLexicons,
})

const CASE_LABELS = [
  ["nominative", "Именительный"],
  ["genitive", "Родительный"],
  ["dative", "Дательный"],
  ["accusative", "Винительный"],
  ["instrumental", "Творительный"],
  ["prepositional", "Предложный"],
] as const

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

function Cases({ values }: { values: { surname: string; given: string; patronymic: string } }) {
  const [declension, setDeclension] = useState<Declension | null>(null)
  const empty = values.surname === "" && values.given === "" && values.patronymic === ""

  useEffect(() => {
    let current = true
    void fio.decline(values).then((next) => {
      if (current) setDeclension(next)
    })
    return () => {
      current = false
    }
  }, [values])

  if (empty) return <p className="hint">Введите фамилию, имя или отчество, чтобы увидеть падежи.</p>
  if (declension === null) {
    return <p className="hint">Пол не определён. Падежи не угадываются, хвост в поле остаётся именительным.</p>
  }

  return (
    <table>
      <caption>Склонение для документа, без предлога</caption>
      <tbody>
        {CASE_LABELS.map(([key, label]) => (
          <tr key={key}>
            <th scope="row">{label}</th>
            <td>{declension.cases[key].full}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function Playground() {
  const fields = useFioFields({ fio })
  const [surname, setSurname] = useState("")
  const [given, setGiven] = useState("")
  const [patronymic, setPatronymic] = useState("")

  return (
    <main>
      <h1>form-tail</h1>
      <p>Tab или стрелка вправо принимают хвост. Escape прячет его. Латиница и цифры не вводятся.</p>
      <form
        onSubmit={(event) => {
          event.preventDefault()
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
      </form>
      <Cases values={{ surname, given, patronymic }} />
    </main>
  )
}

const root = document.querySelector("#root")
if (root === null) throw new Error("нет #root")
createRoot(root).render(<Playground />)
