import { describe, expect, test, vi, beforeEach } from "vitest";

import { GithubEngine } from "./github.js";
describe("GithubEngine", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should parse search results correctly", async () => {
        const results = await GithubEngine.search("prompt");
        // 验证结果
        expect(results.length).toBeGreaterThan(10); // 根据实际结果数量调整
    });
});
