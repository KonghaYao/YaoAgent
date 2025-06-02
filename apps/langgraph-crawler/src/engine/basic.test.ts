import { describe, expect, test, vi, beforeEach } from "vitest";
import { BasicEngine } from "./basic.js";
describe("BasicEngine", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should parse search results correctly", async () => {
        process.env.SEARCH_ENGINE_URL = "https://searx.bndkt.io";
        const results = await BasicEngine.search("searxng");

        // 验证结果
        expect(results.length).toBeGreaterThan(10); // 根据实际结果数量调整
    });
});
