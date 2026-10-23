import { readFile } from "node:fs/promises"
import { execFile } from "node:child_process"
import { promisify } from "node:util"

function run(command: string, args: readonly string[]): Promise<{ stdout: string; stderr: string }> {
  if (process.platform === "win32") {
    return promisify(execFile)("cmd.exe", ["/d", "/s", "/c", command, ...args], { shell: false })
  }
  return promisify(execFile)(command, args, { shell: false })
}

interface PackedFile {
  path?: unknown
}

interface Packed {
  files?: unknown
}

function packedPaths(value: unknown): string[] {
  const entry: unknown = Array.isArray(value) ? value[0] : value
  if (typeof entry !== "object" || entry === null || !("files" in entry)) {
    throw new Error("npm pack не вернул список файлов")
  }
  const files = (entry as Packed).files
  if (!Array.isArray(files)) throw new Error("npm pack не вернул список файлов")
  return files.map((file: unknown) => {
    const path = (file as PackedFile).path
    if (typeof path !== "string") throw new Error("npm pack вернул файл без path")
    return path.replaceAll("\\", "/")
  })
}

const { stdout } = await run("npm", ["pack", "--dry-run", "--json"])
const paths = packedPaths(JSON.parse(stdout))

const required = ["dist/index.js", "dist/index.cjs", "dist/index.d.ts", "README.md", "LICENSE"]
const forbidden = /^(src|lexicon|playground|examples|scripts)\//u
const missing = required.filter((path) => !paths.includes(path))
const leaked = paths.filter((path) => forbidden.test(path) || path.endsWith(".test.ts") || path.endsWith(".test.tsx"))

if (missing.length > 0 || leaked.length > 0) {
  throw new Error(`пакет собран неверно: нет ${missing.join(", ")}; лишнее ${leaked.join(", ")}`)
}

await readFile("dist/ru/buckets/manifest.ts").catch(() => {
  throw new Error("в dist нет корзин словаря")
})

await run("npx", ["publint", "--strict"])
await run("npx", ["attw", "--pack", ".", "--profile", "node16"])
