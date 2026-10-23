import { createFioSuggest } from "form-tail"
import { ruLexicons } from "form-tail/ru"

export const fio = createFioSuggest({
  locale: "ru",
  mode: "soft",
  lexicons: ruLexicons,
})

const declined = await fio.decline({
  surname: "Иванова",
  given: "Мария",
  patronymic: "Сергеевна",
})

if (declined === null) {
  // Пола недостаточно или части спорят. В документ именительный не подставляем наугад.
} else {
  declined.cases.genitive.full
  declined.cases.dative.full
}
