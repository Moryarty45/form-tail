import parser from "@typescript-eslint/parser"
import plugin from "@typescript-eslint/eslint-plugin"
import prettier from "eslint-config-prettier"

export default [
  {
    ignores: ["dist/**", "src/ru/buckets/**", "coverage/**"],
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx", "scripts/**/*.ts", "tsup.config.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "@typescript-eslint": plugin,
    },
    rules: {
      ...plugin.configs["strict-type-checked"].rules,
      ...plugin.configs["stylistic-type-checked"].rules,
      ...prettier.rules,
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
    },
  },
]
