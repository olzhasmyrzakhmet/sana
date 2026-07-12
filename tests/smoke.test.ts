import { describe, it, expect } from "vitest";
import { dbInfo } from "@/lib/data/db";

describe("smoke", () => {
  it("dbInfo возвращает адаптер libsql", () => {
    const info = dbInfo();
    expect(info.adapter).toBe("libsql");
  });
});
