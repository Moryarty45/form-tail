# Использование

Пакет рассчитан на Node 20.11 и новее. TypeScript-типы идут вместе с ним. React нужен только для `form-tail/react`.

```sh
npm install form-tail
npm install react
```

Вторая команда нужна, только если поля рисует React.

## Точки входа

| Импорт | Что даёт |
|---|---|
| `form-tail` | фасад ФИО, память частот, JSON-store, типы ядра |
| `form-tail/react` | поле с хвостом и связка трёх полей одной формы |
| `form-tail/ru` | загрузчик русского словаря |

Внутренние файлы `dist` не являются публичным API.

## Без интерфейса

Один экземпляр создаётся на приложение, а не на каждое поле.

```ts
import { createFioSuggest, memoryUsageStore } from "form-tail"
import { ruLexicons } from "form-tail/ru"

const store = memoryUsageStore()
const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  parts: { surname: true, given: true, patronymic: true },
  store,
  lexicons: ruLexicons,
})

const suggestion = await fio.given.suggest("алек", {
  surname: "Иванова",
  patronymic: "Сергеевна",
})
// { value: "Александра", completion: "сандра", gender: "female" }

fio.given.commit(suggestion.value)
```

`suggest` только читает. `commit` увеличивает частоту, если принят целый токен длиннее одной буквы и без пробела. `filter` в режиме `strict` оставляет русские буквы, дефис и апостроф, затем ставит заглавную первую букву.

Соседние значения передаются в каждом вызове `suggest`. Без них библиотека не знает, что происходит в других полях, и фильтр пола не включится.

## Склонение

`decline` не дописывает хвост и не увеличивает частоту. Он нужен, когда значение уже принято и его надо вставить в документ.

```ts
const declined = await fio.decline({
  surname: "Иванова",
  given: "Мария",
  patronymic: "Сергеевна",
})

if (declined === null) {
  // Пола недостаточно или имя спорит с отчеством.
  // Именительный падеж в документ сам не подставляется.
} else {
  declined.cases.genitive.full
  // «Ивановой Марии Сергеевны»
  declined.cases.dative.full
  // «Ивановой Марии Сергеевне»
}
```

| Ключ | Падеж | Вопрос |
|---|---|---|
| `nominative` | именительный | кто? |
| `genitive` | родительный | кого? |
| `dative` | дательный | кому? |
| `accusative` | винительный | кого? |
| `instrumental` | творительный | кем? |
| `prepositional` | предложный | о ком? |

`full` собирает непустые части через пробел. Предлога «о» в нём нет: его ставит шаблон документа. У каждой части есть своё поле: `surname`, `given`, `patronymic`.

Явный пол передаётся тем же объектом и перекрывает вывод:

```ts
await fio.decline({ surname: "Шевченко", given: "Алекс", gender: "male" })
```

`null` возвращается, пока пол `unknown`. Это неполная строка без склоняемой фамилии, форма вроде `Женя` или конфликт `Алексей` + `Ивановна`. Вызывающий код решает, попросить пол явно или оставить именительный. Библиотека второй вариант сама не выбирает.

Окончание вне таблицы правил не склоняется. `Шевченко`, `Дюма` и похожие формы остаются как введены. Это отказ, а не попытка угадать падеж.

Готовый вызов без React: [examples/node.ts](../examples/node.ts).

## React

`useFioFields` хранит текущие значения одной формы и передаёт их соседним частям. Это не id формы и не отдельный store.

```tsx
import { createFioSuggest } from "form-tail"
import { FormTailInput, useFioFields } from "form-tail/react"
import { ruLexicons } from "form-tail/ru"

const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  lexicons: ruLexicons,
})

export function FioForm() {
  const fields = useFioFields({ fio })

  return (
    <form>
      <FormTailInput
        aria-label="Фамилия"
        engine={fields.surname}
        name="surname"
        onChange={fields.setSurname}
      />
      <FormTailInput
        aria-label="Имя"
        engine={fields.given}
        name="given"
        onChange={fields.setGiven}
      />
      <FormTailInput
        aria-label="Отчество"
        engine={fields.patronymic}
        name="patronymic"
        onChange={fields.setPatronymic}
      />
    </form>
  )
}
```

`onChange` получает уже отфильтрованную строку, а не событие input. Для связки пола его передавать в `set*` не обязательно: поле само сообщает значение до подсказки. `setSurname`, `setGiven` и `setPatronymic` нужны, если значение изменилось снаружи и поле этот ввод не видело.

Если значением управляет внешний `useState`, обновляйте оба состояния:

```tsx
onChange={(value) => {
  setGiven(value)
  fields.setGiven(value)
}}
```

Tab и стрелка вправо принимают хвост, когда курсор стоит в конце и набор через IME закрыт. Escape прячет хвост до следующего изменения. Уход из поля принимает целиком введённый токен, но не дописывает хвост самовольно.

Хвост лежит в отдельном элементе. Его нет в `value`, в отправляемом имени поля и в буфере обмена, пока пользователь его не принял. Цвет хвоста задаётся переменной `--form-tail-completion`.

Полный пример: [examples/react.tsx](../examples/react.tsx).

## Electron

Библиотека не импортирует `fs` и Electron. Хост читает и пишет файл сам. Файл должен лежать в `app.getPath("userData")`, а не в каталоге установки и не внутри asar.

```ts
import { app } from "electron"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { createFioSuggest, createJsonUsageStore } from "form-tail"
import { ruLexicons } from "form-tail/ru"

const directory = app.getPath("userData")
const target = path.join(directory, "form-tail-usage.json")

const store = createJsonUsageStore({
  async read() {
    try {
      return await readFile(target, "utf8")
    } catch (error) {
      if (isMissing(error)) return ""
      throw error
    }
  },
  async write(contents) {
    await mkdir(directory, { recursive: true })
    const temporary = path.join(directory, `form-tail-usage.${process.pid}.tmp`)
    await writeFile(temporary, contents, "utf8")
    await rename(temporary, target)
  },
})

export const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  store,
  lexicons: ruLexicons,
})
```

Один `store` передаётся во все экземпляры, которым нужен общий счётчик. Запись откладывается, встаёт в одну очередь и заменяется через временный файл, чтобы обрыв не стёр документ. Битый JSON не становится новым источником записи.

Перед первым `commit` дождитесь `store.ready()`. Если чтение отклонилось, `flush` отклоняется той же ошибкой, а запись не планируется: пустая память не затирает нечитаемый файл. После починки файла store нужно создать заново.

Готовый пример: [examples/electron-store.ts](../examples/electron-store.ts).

## Свой интерфейс

Для своего поля достаточно трёх методов части: `filter`, `suggest`, `commit`.

1. Пропустите ввод через `filter`.
2. Запросите `suggest` и нарисуйте `completion` отдельно от value.
3. После Tab, стрелки вправо или явной кнопки запишите `suggestion.value` и вызовите `commit`.
4. Отбрасывайте устаревший ответ, если пользователь уже ввёл следующий символ.

`useFormTail` делает эти шаги для одного input. Ему можно передать как часть ФИО, так и синхронный `PartEngine`.

## Локальная проверка

В каталоге проекта:

```sh
npm run dev
```

Откройте `http://127.0.0.1:5173` и обновите страницу после изменения словаря. Это стенд, а не публичный API пакета.
