import { createFioSuggest } from "../src/index.ts"
import { ruLexicons } from "../src/ru/index.ts"

const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  lexicons: ruLexicons,
})

const given = await fio.given.suggest("Алек")
const patronymic = await fio.patronymic.suggest("Иван", { given: "Алексей" })

console.log(given)
console.log(patronymic)
console.log(fio.given.filter("IvanАлек1"))
