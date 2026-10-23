import { app } from "electron"
import { mkdir, readFile, rename, writeFile } from "node:fs/promises"
import path from "node:path"
import { createFioSuggest, createJsonUsageStore } from "form-tail"
import { ruLexicons } from "form-tail/ru"

const directory = app.getPath("userData")
const target = path.join(directory, "form-tail-usage.json")

export const store = createJsonUsageStore({
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
  mode: "soft",
  store,
  lexicons: ruLexicons,
})

function isMissing(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT"
}
