import { describe, expect, test, vi, beforeEach } from "vitest";

import { AnthropicEngine } from "./authropic.js";
describe("BasicEngine", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should parse search results correctly", async () => {
        const results = await AnthropicEngine.search("prompt");
        // 验证结果
        expect(results.length).toBeGreaterThan(10); // 根据实际结果数量调整
    });
});
