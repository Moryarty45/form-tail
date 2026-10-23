import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export type SourceGender = "male" | "female" | "unknown"
export type SourcePart = "surname" | "given" | "patronymic"

export interface SourceEntry {
  value: string
  weight: number
  gender: SourceGender
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SOURCE_DIR = path.join(ROOT, "lexicon")
const BUCKET_DIR = path.join(ROOT, "src", "ru", "buckets")

const CYRILLIC = /^[А-ЯЁ][а-яё]*(?:-[А-ЯЁ][а-яё]*)*$/u
const PATRONYMIC = /(?:ович|евич|ич|овна|евна|ична|ычна)$/u

function fold(value: string): string {
  return value.toLocaleLowerCase("ru").replace(/ё/gu, "е")
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

function feminineSurname(value: string): string | null {
  const ending = Object.keys(SURNAME_FEMININE)
    .sort((left, right) => right.length - left.length)
    .find((suffix) => value.toLocaleLowerCase("ru").endsWith(suffix))
  if (ending === undefined) return null
  const suffix = SURNAME_FEMININE[ending]
  if (suffix === undefined) return null
  return value.slice(0, value.length - ending.length) + suffix
}

function parseSurnameLine(line: string, lineNumber: number): SourceEntry {
  const [value, weightText] = line.split("|")
  if (value === undefined || weightText === undefined) {
    throw new Error(`surname.txt:${lineNumber} ожидается value|weight`)
  }
  if (!CYRILLIC.test(value)) throw new Error(`surname.txt:${lineNumber} недопустимое написание: ${value}`)
  const weight = Number(weightText)
  if (!Number.isInteger(weight) || weight < 1) {
    throw new Error(`surname.txt:${lineNumber} вес должен быть целым больше нуля`)
  }
  return { value, weight, gender: "unknown" }
}

async function readSurnames(): Promise<SourceEntry[]> {
  const raw = await readFile(path.join(SOURCE_DIR, "surname.txt"), "utf8")
  const lines = raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
  const entries = lines.map((line, index) => parseSurnameLine(line, index + 1))
  const seen = new Set(entries.map((entry) => fold(entry.value)))
  for (const entry of [...entries]) {
    const feminine = feminineSurname(entry.value)
    if (feminine === null) continue
    const key = fold(feminine)
    if (seen.has(key)) continue
    seen.add(key)
    entries.push({ value: feminine, weight: entry.weight, gender: "unknown" })
  }
  return entries
}

function parseLine(line: string, file: string, lineNumber: number): SourceEntry {
  const [value, weightText, gender] = line.split("|")
  if (value === undefined || weightText === undefined || gender === undefined) {
    throw new Error(`${file}:${lineNumber} ожидается value|weight|gender`)
  }
  if (!CYRILLIC.test(value)) throw new Error(`${file}:${lineNumber} недопустимое написание: ${value}`)
  const weight = Number(weightText)
  if (!Number.isInteger(weight) || weight < 1) {
    throw new Error(`${file}:${lineNumber} вес должен быть целым больше нуля`)
  }
  if (gender !== "male" && gender !== "female" && gender !== "unknown") {
    throw new Error(`${file}:${lineNumber} неизвестный пол: ${gender}`)
  }
  return { value, weight, gender }
}

async function readPart(part: SourcePart): Promise<SourceEntry[]> {
  if (part === "surname") return readSurnames()
  const file = path.join(SOURCE_DIR, `${part}.txt`)
  const raw = await readFile(file, "utf8")
  const entries = raw
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
    .map((line, index) => parseLine(line, `${part}.txt`, index + 1))

  const seen = new Set<string>()
  for (const entry of entries) {
    const key = fold(entry.value)
    if (seen.has(key)) throw new Error(`${part}.txt повтор: ${entry.value}`)
    seen.add(key)
    if (part === "patronymic" && !PATRONYMIC.test(fold(entry.value))) {
      throw new Error(`${part}.txt отчество без ожидаемого суффикса: ${entry.value}`)
    }
  }
  return entries
}

function renderBucket(entries: readonly SourceEntry[]): string {
  const rows = entries
    .map((entry) => `  { value: ${JSON.stringify(entry.value)}, weight: ${entry.weight}, gender: ${JSON.stringify(entry.gender)} },`)
    .join("\n")
  return `import type { LexiconEntry } from "../../../core/types.ts"\n\nconst entries = [\n${rows}\n] as const satisfies readonly LexiconEntry[]\n\nexport default entries\n`
}

export async function buildLexicon(): Promise<void> {
  await rm(BUCKET_DIR, { recursive: true, force: true })
  await mkdir(BUCKET_DIR, { recursive: true })
  const lettersByPart: Record<SourcePart, string[]> = {
    surname: [],
    given: [],
    patronymic: [],
  }

  for (const part of ["surname", "given", "patronymic"] as const) {
    const grouped = new Map<string, SourceEntry[]>()
    for (const entry of await readPart(part)) {
      const letter = fold(entry.value)[0]
      if (letter === undefined) continue
      const bucket = grouped.get(letter) ?? []
      bucket.push(entry)
      grouped.set(letter, bucket)
    }
    for (const [letter, entries] of grouped) {
      entries.sort((left, right) => fold(left.value).localeCompare(fold(right.value), "ru"))
      const dir = path.join(BUCKET_DIR, part)
      await mkdir(dir, { recursive: true })
      await writeFile(path.join(dir, `${letter}.ts`), renderBucket(entries), "utf8")
    }
    lettersByPart[part] = [...grouped.keys()].sort((left, right) => left.localeCompare(right, "ru"))
  }

  const manifest = `export const bucketLetters = ${JSON.stringify(lettersByPart)} as const\n`
  await writeFile(path.join(BUCKET_DIR, "manifest.ts"), manifest, "utf8")
  await writeLoaders(lettersByPart)
}

async function writeLoaders(lettersByPart: Record<SourcePart, readonly string[]>): Promise<void> {
  const file = path.join(ROOT, "src", "ru", "load.ts")
  let source = await readFile(file, "utf8")
  for (const part of ["surname", "given", "patronymic"] as const) {
    const marker = `/* ${part}-loaders */`
    const start = source.indexOf(marker)
    const end = source.indexOf("\n      }", start)
    if (start < 0 || end < 0) throw new Error(`load.ts: не найден блок ${part}`)
    const rows = lettersByPart[part]
      .map((letter) => `        ${letter}: () => import("./buckets/${part}/${letter}"),`)
      .join("\n")
    source = `${source.slice(0, start)}${marker}\n${rows}${source.slice(end)}`
  }
  await writeFile(file, source, "utf8")
}

export async function generatedBucketFiles(): Promise<string[]> {
  const files: string[] = []
  for (const part of ["surname", "given", "patronymic"] as const) {
    const dir = path.join(BUCKET_DIR, part)
    const names = await readdir(dir).catch(() => [])
    for (const name of names) files.push(path.join(part, name))
  }
  return files
}

const isDirectRun = process.argv[1] !== undefined && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
if (isDirectRun) {
  await buildLexicon()
}
