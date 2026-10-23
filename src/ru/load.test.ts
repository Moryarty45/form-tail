import { describe, expect, it, vi } from "vitest"

vi.mock("./buckets/given/а.ts", () => ({
  default: [{ value: "Алексей", weight: 1, gender: "male" }],
}))

import { loadRuBucket } from "./load.ts"

describe("loadRuBucket", () => {
  it("не открывает корзину для буквы вне поставки и кэширует загруженную", async () => {
    expect(await loadRuBucket("given", "q")).toEqual([])
    const first = await loadRuBucket("given", "а")
    const second = await loadRuBucket("given", "а")
    expect(first).toBe(second)
    expect(first[0]?.value).toBe("Алексей")
  })
})
