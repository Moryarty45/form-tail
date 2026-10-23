import { createFioSuggest } from "form-tail"
import { FormTailInput, useFioFields } from "form-tail/react"
import { ruLexicons } from "form-tail/ru"
import { useState } from "react"

const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  lexicons: ruLexicons,
})

export function FioForm() {
  const fields = useFioFields({ fio })
  const [given, setGiven] = useState("")
  const [patronymic, setPatronymic] = useState("")

  return (
    <form>
      <FormTailInput
        aria-label="Фамилия"
        engine={fields.surname}
        name="surname"
      />
      <FormTailInput
        aria-label="Имя"
        engine={fields.given}
        name="given"
        value={given}
        onChange={(value) => {
          setGiven(value)
          fields.setGiven(value)
        }}
      />
      <FormTailInput
        aria-label="Отчество"
        engine={fields.patronymic}
        name="patronymic"
        value={patronymic}
        onChange={(value) => {
          setPatronymic(value)
          fields.setPatronymic(value)
        }}
      />
    </form>
  )
}
