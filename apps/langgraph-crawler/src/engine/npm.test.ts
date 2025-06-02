import { describe, expect, test, vi, beforeEach } from "vitest";
import { NpmEngine } from "./npm.js";

describe("NpmEngine", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should search npm packages", async () => {
        const results = await NpmEngine.search("@langchain/langgraph");
        expect(results).toBeDefined();
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].title).toBe("@langchain/langgraph");
        expect(results[0].url).toBe("https://www.npmjs.com/package/@langchain/langgraph");
        expect(results[0].description).toContain("LangGraph");
        expect(results[0].updateTime).toBeDefined();
        expect(results[0].metadata).toBeDefined();
    });
});
