import { context } from "esbuild"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { createServer } from "node:http"
import path from "node:path"

const outdir = path.resolve("playground/dist")
await mkdir(outdir, { recursive: true })

const result = await context({
  entryPoints: ["playground/main.tsx"],
  bundle: true,
  format: "esm",
  outfile: path.join(outdir, "main.js"),
  jsx: "automatic",
  loader: { ".css": "css" },
})

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1")
  if (url.pathname === "/main.js") {
    response.writeHead(200, { "content-type": "text/javascript; charset=utf-8" })
    response.end(await readFile(path.join(outdir, "main.js")))
    return
  }
  if (url.pathname === "/main.css") {
    response.writeHead(200, { "content-type": "text/css; charset=utf-8" })
    response.end(await readFile(path.join(outdir, "main.css")))
    return
  }
  const html = await readFile("playground/index.html", "utf8")
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" })
  response.end(html.replace("./main.tsx", "/main.js"))
})

await result.watch()
server.listen(5173, "127.0.0.1", () => {
  console.log("http://127.0.0.1:5173")
})
