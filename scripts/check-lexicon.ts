import { readFile, readdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const BUCKET_DIR = path.join(ROOT, "src", "ru", "buckets")
const ENTRY = /value: "([^"]+)", weight: (\d+), gender: "(male|female|unknown)"/gu
const PATRONYMIC = /(?:ович|евич|ич|овна|евна|ична|ычна)$/u

function fold(value: string): string {
  return value.toLocaleLowerCase("ru").replace(/ё/gu, "е")
}

const errors: string[] = []

for (const part of ["surname", "given", "patronymic"] as const) {
  const dir = path.join(BUCKET_DIR, part)
  const files = (await readdir(dir)).filter((name) => name.endsWith(".ts"))
  const seen = new Set<string>()
  for (const file of files) {
    const letter = file.replace(/\.ts$/u, "")
    const source = await readFile(path.join(dir, file), "utf8")
    const values: string[] = []
    for (const match of source.matchAll(ENTRY)) {
      const value = match[1]
      if (value === undefined) continue
      values.push(value)
      const key = fold(value)
      if (seen.has(key)) errors.push(`${part}: повтор ${value}`)
      seen.add(key)
      if (!key.startsWith(letter)) errors.push(`${file}: ${value} не в корзине ${letter}`)
      if (part === "patronymic" && !PATRONYMIC.test(key)) {
        errors.push(`${file}: ${value} без суффикса отчества`)
      }
    }
    const sorted = [...values].sort((left, right) => fold(left).localeCompare(fold(right), "ru"))
    if (values.join("|") !== sorted.join("|")) errors.push(`${part}/${file}: корзина не отсортирована`)
    if (values.length === 0) errors.push(`${part}/${file}: пустая корзина`)
  }
}

if (errors.length > 0) {
  console.error(errors.join("\n"))
  process.exit(1)
}
