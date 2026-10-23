# Использование

Пакет рассчитан на Node 20 и новее. TypeScript-типы идут вместе с ним. React нужен только для `form-tail/react`.

```sh
pnpm add form-tail
pnpm add react
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

`onChange` получает уже отфильтрованную строку, а не событие input. Его нужно передать в `setSurname`, `setGiven` или `setPatronymic`: иначе соседнее поле не увидит пол связки.

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

Один `store` передаётся во все экземпляры, которым нужен общий счётчик. Запись откладывается и заменяется через временный файл, чтобы обрыв не стёр документ. Битый JSON не становится новым источником записи.

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
pnpm dev
```

Откройте `http://127.0.0.1:5173` и обновите страницу после изменения словаря. Это стенд, а не публичный API пакета.
