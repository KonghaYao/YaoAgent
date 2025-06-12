import { describe, expect, test, vi, beforeEach } from "vitest";
import { BingEngine } from "./bing.js";

describe("BingEngine", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should parse search results correctly", async () => {
        const results = await BingEngine.search("vue");

        // 验证结果
        expect(results.length).toBeGreaterThan(0); // 应该至少有一些结果

        console.log(results);
        // 检查第一个结果的结构
        if (results.length > 0) {
            const firstResult = results[0];
            expect(firstResult).toHaveProperty("title");
            expect(firstResult).toHaveProperty("url");
            expect(firstResult).toHaveProperty("description");
            expect(firstResult).toHaveProperty("updateTime");
            expect(firstResult).toHaveProperty("metadata");
            expect(firstResult.metadata).toHaveProperty("source", "bing");
        }
    });
});
