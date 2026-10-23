import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE_DIR = path.join(ROOT, "lexicon")
const CYRILLIC = /^[А-ЯЁ][а-яё]*(?:-[А-ЯЁ][а-яё]*)*$/u
const PATRONYMIC = /(?:ович|евич|ич|овна|евна|ична|ычна)$/iu

interface RawEntry {
  value: string
  gender: "male" | "female" | "unknown"
}

function fold(value: string): string {
  return value.toLocaleLowerCase("ru").replace(/ё/gu, "е")
}

function capitalize(value: string): string {
  const first = value.charAt(0).toLocaleUpperCase("ru")
  const rest = value.slice(1).toLocaleLowerCase("ru")
  return `${first}${rest}`
}

const GLUED_SURNAMES = new Map<string, readonly string[]>([
  ["БалакинБаланов", ["Балакин", "Баланов"]],
  ["ВойновскийВолгин", ["Войновский", "Волгин"]],
  ["СкокСкорняков", ["Скок", "Скорняков"]],
  ["СоветскийСойкин", ["Советский", "Сойкин"]],
])

function splitGlued(value: string): string[] {
  const known = GLUED_SURNAMES.get(value.trim())
  if (known !== undefined) return [...known]
  const normalized = value
    .trim()
    .split(/\s+/u)
    .map((part) => part.split("-").map(capitalize).join("-"))
    .join("-")
  return normalized.split(/(?<=[а-яё])(?=[А-ЯЁ])/u).map((part) => part.trim())
}

async function readWords(file: string): Promise<string[]> {
  const raw = await readFile(path.join(SOURCE_DIR, file), "utf8")
  return raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .flatMap(splitGlued)
}

function assertWord(value: string, file: string): void {
  if (!CYRILLIC.test(value)) {
    throw new Error(`${file}: недопустимое написание «${value}»`)
  }
}

function dedupe(entries: readonly RawEntry[]): RawEntry[] {
  const seen = new Map<string, RawEntry>()
  for (const entry of entries) {
    const key = fold(entry.value)
    const previous = seen.get(key)
    if (previous === undefined) {
      seen.set(key, entry)
      continue
    }
    if (previous.gender !== entry.gender) {
      seen.set(key, { ...previous, gender: "unknown" })
    }
  }
  return [...seen.values()].sort((left, right) =>
    fold(left.value).localeCompare(fold(right.value), "ru"),
  )
}

async function readFemalePatronymics(): Promise<{ patronymics: string[]; names: string[] }> {
  const words = await readWords("female_patronymics.txt")
  const names = words.filter((value) => !PATRONYMIC.test(value))
  if (names.some((value) => value !== "Григорий")) {
    throw new Error(`patronymics: неожиданные строки без суффикса: ${names.join(", ")}`)
  }
  return { patronymics: words.filter((value) => PATRONYMIC.test(value)), names }
}

async function importLists(): Promise<void> {
  const surnames = dedupe(
    (await readWords("surnames.txt")).map((value) => {
      assertWord(value, "surnames.txt")
      return { value, gender: "unknown" as const }
    }),
  )

  const femalePatronymics = await readFemalePatronymics()

  const given = dedupe(
    [
      ...(await readWords("male_names.txt")).map((value) => ({ value, gender: "male" as const })),
      ...(await readWords("female_names.txt")).map((value) => ({ value, gender: "female" as const })),
      ...femalePatronymics.names.map((value) => ({ value, gender: "female" as const })),
    ].map((entry) => {
      assertWord(entry.value, "names")
      return entry
    }),
  )

  const patronymics = dedupe(
    [
      ...(await readWords("male_patronymics.txt")).map((value) => ({ value, gender: "male" as const })),
      ...femalePatronymics.patronymics.map((value) => ({ value, gender: "female" as const })),
    ].map((entry) => {
      assertWord(entry.value, "patronymics")
      if (!PATRONYMIC.test(entry.value)) {
        throw new Error(`patronymics: «${entry.value}» без ожидаемого суффикса`)
      }
      return entry
    }),
  )

  const header = [
    "# Источник: подготовленные списки lexicon/*.txt.",
    "# Частот в источниках нет, поэтому у каждой формы вес 1.",
    "# Личная частота пользователя важнее этого веса.",
  ]
  await writeFile(
    path.join(SOURCE_DIR, "surname.txt"),
    [...header, ...surnames.map((entry) => `${entry.value}|1`), ""].join("\n"),
    "utf8",
  )
  await writeFile(
    path.join(SOURCE_DIR, "given.txt"),
    [...header, ...given.map((entry) => `${entry.value}|1|${entry.gender}`), ""].join("\n"),
    "utf8",
  )
  await writeFile(
    path.join(SOURCE_DIR, "patronymic.txt"),
    [...header, ...patronymics.map((entry) => `${entry.value}|1|${entry.gender}`), ""].join("\n"),
    "utf8",
  )

  console.log(
    `surname ${surnames.length}, given ${given.length}, patronymic ${patronymics.length}`,
  )
}

await importLists()
