import { cp } from "node:fs/promises"
import { defineConfig } from "tsup"

const shared = {
  format: ["esm", "cjs"] as ("esm" | "cjs")[],
  dts: true,
  sourcemap: true,
  clean: false,
  treeshake: true,
  target: "es2022" as const,
}

export default defineConfig([
  {
    ...shared,
    clean: true,
    entry: { index: "src/index.ts" },
  },
  {
    ...shared,
    entry: { "react/index": "src/react/index.ts" },
    external: ["react", "react/jsx-runtime"],
    esbuildOptions(options) {
      options.jsx = "automatic"
    },
  },
  {
    ...shared,
    entry: { "ru/index": "src/ru/index.ts" },
    // Корзины грузятся по букве и не входят в статический бандл входа.
    external: [/^\.\/buckets\//],
    async onSuccess() {
      await cp("src/ru/buckets", "dist/ru/buckets", { recursive: true })
    },
  },
])
