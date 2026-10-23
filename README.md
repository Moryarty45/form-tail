# form-tail

Дописывает хвост значения в поле формы и склоняет уже принятое ФИО для документа. Первая поставка — фамилия, имя и отчество. Выпадающего списка нет: ненабранная часть рисуется отдельно от value и попадает в поле только после принятия.

```ts
import { createFioSuggest, createJsonUsageStore } from "form-tail"
import { ruLexicons } from "form-tail/ru"

const store = createJsonUsageStore({ read, write })
const fio = createFioSuggest({
  locale: "ru",
  mode: "strict",
  parts: { surname: true, given: true, patronymic: true },
  store,
  lexicons: ruLexicons,
})

const suggestion = await fio.given.suggest("Алек")
// { value: "Александр", completion: "сандр", gender: "male" }
```

`suggest` ничего не записывает. Частота растёт в `commit`, когда токен принят целиком и длиннее одной буквы.

## Документация

- [Возможности и правила подсказки](docs/overview.md)
- [Установка и использование](docs/usage.md)
- [Архитектура](docs/architecture.md)
- [Словарь](docs/lexicon.md)
- [Чего нет в первой версии](docs/todo.md)

Примеры: [React](examples/react.tsx), [Electron](examples/electron-store.ts), [Node](examples/node.ts).

## Установка

```sh
npm install form-tail react
```

React нужен только для `form-tail/react`. Ядро и словарь от него не зависят. Node 20.11 или новее.

## Быстрый старт

Строгий режим оставляет русские буквы, дефис и апостроф. Неизвестное русское слово ввести можно. Принятая форма получает заглавную первую букву.

Один store на приложение хранит частоты всех форм. Части между собой не смешиваются. Для Electron файл кладётся в `app.getPath("userData")`: библиотека сама не открывает диск и не импортирует Electron.

В React три поля одной формы связываются через `useFioFields`. В `onChange` нужно сообщать текущее значение соседним частям, иначе фильтр пола его не увидит.

Полная настройка, клавиши и свой интерфейс — в [usage.md](docs/usage.md).

## Локальная проверка

```sh
npm run dev
```

Стенд откроется на `http://127.0.0.1:5173`.

## Ограничения v1

Список отложенной работы — в [todo.md](docs/todo.md).
