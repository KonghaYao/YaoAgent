import { describe, expect, test, vi, beforeEach } from "vitest";
import { JuejinEngine } from "./juejin.js";
import { SearchResultSchema } from "../search.js";

describe("JuejinEngine", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should parse search results correctly", async () => {
        const results = await JuejinEngine.search("测试");

        expect(results.length).toBeGreaterThan(10);
        results.forEach((result) => {
            expect(SearchResultSchema.safeParse(result).success).toBe(true);
        });
    });
});
