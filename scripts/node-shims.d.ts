declare module "esbuild" {
  export function context(options: {
    entryPoints: string[]
    bundle: boolean
    format: "esm"
    outfile?: string
    outdir?: string
    entryNames?: string
    jsx: "automatic"
    loader: Record<string, string>
  }): Promise<{ watch(): Promise<void> }>
}

declare module "node:http" {
  interface ServerResponse {
    writeHead(status: number, headers: Record<string, string>): void
    end(body?: string | Uint8Array): void
  }
  interface IncomingMessage {
    url?: string
  }
  export function createServer(
    listener: (request: IncomingMessage, response: ServerResponse) => void | Promise<void>,
  ): { listen(port: number, host: string, callback: () => void): void }
}

declare module "node:fs/promises" {
  export function cp(
    source: string,
    target: string,
    options?: { recursive?: boolean },
  ): Promise<void>
  export function mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
  export function readFile(path: string, encoding: "utf8"): Promise<string>
  export function readFile(path: string): Promise<Uint8Array>
  export function readdir(path: string): Promise<string[]>
  export function rename(from: string, to: string): Promise<void>
  export function rm(path: string, options?: { recursive?: boolean; force?: boolean }): Promise<void>
  export function writeFile(path: string, data: string, encoding: "utf8"): Promise<void>
}

declare module "node:path" {
  interface Path {
    dirname(value: string): string
    join(...parts: string[]): string
    resolve(...parts: string[]): string
  }
  const path: Path
  export default path
}

declare module "node:url" {
  export function fileURLToPath(url: string): string
}

interface ImportMeta {
  url: string
  dirname: string
}

declare const process: {
  argv: string[]
  pid: number
  platform: string
  exit(code: number): never
}
declare const console: {
  error(...values: unknown[]): void
  log(...values: unknown[]): void
}

declare module "node:child_process" {
  export function execFile(
    file: string,
    args: readonly string[],
    options: { shell?: boolean },
    callback: (error: Error | null, result: { stdout: string; stderr: string }) => void,
  ): void
}

declare module "node:util" {
  export function promisify(
    fn: typeof import("node:child_process").execFile,
  ): (
    file: string,
    args: readonly string[],
    options: { shell?: boolean },
  ) => Promise<{ stdout: string; stderr: string }>
}
