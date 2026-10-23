import { createFioSuggest } from "form-tail"
import { ruLexicons } from "form-tail/ru"

export const fio = createFioSuggest({
  locale: "ru",
  mode: "soft",
  lexicons: ruLexicons,
})
