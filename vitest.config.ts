import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    environmentMatchGlobs: [["src/react/**", "jsdom"]],
    coverage: {
      provider: "v8",
      include: ["src/core/**/*.ts", "src/fio/**/*.ts", "src/react/**/*.ts", "src/react/**/*.tsx"],
      exclude: ["**/*.test.ts", "**/*.test.tsx", "**/index.ts"],
      thresholds: { lines: 90, functions: 88, statements: 90, branches: 80 },
    },
  },
})
