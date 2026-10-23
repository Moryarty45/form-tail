import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE_DIR = path.join(ROOT, "lexicon")
const BUCKET_DIR = path.join(ROOT, "src", "ru", "buckets")
const ENTRY = /value: "([^"]+)", weight: (\d+), gender: "(male|female|unknown)"/gu
const PATRONYMIC = /(?:ович|евич|ич|овна|евна|ична|ычна)$/u
const MALE_PATRONYMIC = /(?:ович|евич|ич)$/u
const FEMALE_PATRONYMIC = /(?:овна|евна|ична|ычна)$/u
const MALE_A = new Set(["никита", "илья", "кузьма", "фома", "савва", "лука", "данила"])

type Part = "surname" | "given" | "patronymic"
type Gender = "male" | "female" | "unknown"

interface Item {
  value: string
  gender: Gender
}

const SURNAME_FEMININE: Readonly<Record<string, string>> = {
  ов: "ова",
  ев: "ева",
  ёв: "ёва",
  ин: "ина",
  ын: "ына",
  ий: "ая",
  ый: "ая",
  ой: "ая",
}

function fold(value: string): string {
  return value.toLocaleLowerCase("ru").replace(/ё/gu, "е")
}

function feminineSurname(value: string): string | null {
  const ending = Object.keys(SURNAME_FEMININE)
    .sort((left, right) => right.length - left.length)
    .find((suffix) => value.toLocaleLowerCase("ru").endsWith(suffix))
  if (ending === undefined) return null
  const suffix = SURNAME_FEMININE[ending]
  if (suffix === undefined) return null
  return value.slice(0, value.length - ending.length) + suffix
}

function expectedItems(part: Part, source: readonly Item[]): Item[] {
  if (part !== "surname") return [...source]
  const seen = new Set(source.map((item) => fold(item.value)))
  const generated = [...source]
  for (const item of source) {
    const feminine = feminineSurname(item.value)
    if (feminine === null || seen.has(fold(feminine))) continue
    seen.add(fold(feminine))
    generated.push({ value: feminine, gender: "unknown" })
  }
  return generated
}

function parseSource(raw: string, part: Part): Item[] {
  return raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line) => {
      const [value, , gender] = line.split("|")
      return {
        value: value ?? "",
        gender: part === "surname" ? "unknown" : ((gender as Gender | undefined) ?? "unknown"),
      }
    })
}

const errors: string[] = []
const warnings: string[] = []

for (const part of ["surname", "given", "patronymic"] as const) {
  const source = expectedItems(part, parseSource(await readFile(path.join(SOURCE_DIR, `${part}.txt`), "utf8"), part))
  const sourceKeys = new Map(source.map((item) => [fold(item.value), item]))
  const dir = path.join(BUCKET_DIR, part)
  const files = (await readdir(dir)).filter((name) => name.endsWith(".ts"))
  const seen = new Set<string>()
  const bucketKeys = new Set<string>()

  for (const file of files) {
    const letter = file.replace(/\.ts$/u, "")
    const text = await readFile(path.join(dir, file), "utf8")
    const values: string[] = []
    for (const match of text.matchAll(ENTRY)) {
      const value = match[1]
      const gender = match[3] as Gender | undefined
      if (value === undefined || gender === undefined) continue
      values.push(value)
      const key = fold(value)
      bucketKeys.add(key)
      if (seen.has(key)) errors.push(`${part}: повтор ${value}`)
      seen.add(key)
      if (!key.startsWith(letter)) errors.push(`${file}: ${value} не в корзине ${letter}`)
      const fromSource = sourceKeys.get(key)
      if (fromSource === undefined) errors.push(`${part}: ${value} есть в корзине, но нет в источнике`)
      else if (fromSource.gender !== gender) {
        errors.push(`${part}: пол ${value} в корзине ${gender}, в источнике ${fromSource.gender}`)
      }
      if (part === "patronymic" && !PATRONYMIC.test(key)) {
        errors.push(`${file}: ${value} без суффикса отчества`)
      }
      if (part === "patronymic" && MALE_PATRONYMIC.test(key) && gender === "female") {
        errors.push(`${part}: мужской суффикс с женским полом: ${value}`)
      }
      if (part === "patronymic" && FEMALE_PATRONYMIC.test(key) && gender === "male") {
        errors.push(`${part}: женский суффикс с мужским полом: ${value}`)
      }
      if (part === "given" && gender === "male" && /[ая]$/u.test(key) && !MALE_A.has(key)) {
        warnings.push(`имя на -а/-я помечено male: ${value}`)
      }
      if (part === "given" && gender === "female" && /[^аеёиоуыэюя]$/u.test(key)) {
        warnings.push(`имя на согласную помечено female: ${value}`)
      }
    }
    const sorted = [...values].sort((left, right) => fold(left).localeCompare(fold(right), "ru"))
    if (values.join("|") !== sorted.join("|")) errors.push(`${part}/${file}: корзина не отсортирована`)
    if (values.length === 0) errors.push(`${part}/${file}: пустая корзина`)
  }

  for (const item of source) {
    if (!bucketKeys.has(fold(item.value))) errors.push(`${part}: ${item.value} есть в источнике, но нет в корзине`)
  }
}

if (warnings.length > 0) console.log(warnings.join("\n"))
if (errors.length > 0) {
  console.error(errors.join("\n"))
  process.exit(1)
}
