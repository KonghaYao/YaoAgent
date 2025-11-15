import { describe, expect, test, vi, beforeEach } from "vitest";
import { search, SearchResultSchema } from "./search.js";

describe("search", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should search with default engines", async () => {
        const results = await search({
            query: "typescript",
            engines: ["bing"],
            returnType: "json",
            withMetadata: true,
        });
        expect(Array.isArray(results)).toBe(true);
        expect((results as any[]).length).toBeGreaterThan(0);
        (results as any[]).forEach((result: any) => {
            expect(result).toHaveProperty("engine");
            expect(result).toHaveProperty("results");
            expect(Array.isArray(result.results)).toBe(true);
        });
    });

    test("should search with specific engines", async () => {
        const results = await search({
            query: "javascript",
            engines: ["bing"],
            returnType: "json",
            withMetadata: true,
        });
        expect(Array.isArray(results)).toBe(true);
        expect((results as any[]).length).toBe(1);
        expect((results as any[])[0].engine).toBe("bing");
    });

    test("should return markdown format", async () => {
        const result = await search({
            query: "react",
            engines: ["bing"],
            returnType: "markdown",
            withMetadata: true,
        });
        expect(typeof result).toBe("string");
        expect(result as string).toContain("## [");
        expect(result as string).toContain("from_engine:");
    });

    test("should return json format without metadata", async () => {
        const results = await search({
            query: "vue",
            engines: ["bing"],
            returnType: "json",
            withMetadata: false,
        });
        expect(Array.isArray(results)).toBe(true);
        (results as any[]).forEach((result: any) => {
            result.results.forEach((item: any) => {
                expect(item).not.toHaveProperty("metadata");
            });
        });
    });

    test("should throw error when no engines found", async () => {
        await expect(
            search({
                query: "test",
                engines: [] as any,
                returnType: "json",
                withMetadata: true,
            })
        ).rejects.toThrow("No engines found for topic");
    });

    test("should validate search result schema", async () => {
        const results = await search({
            query: "node.js",
            engines: ["bing"],
            returnType: "json",
            withMetadata: true,
        });
        expect(Array.isArray(results)).toBe(true);
        (results as any[]).forEach((result: any) => {
            result.results.forEach((item: any) => {
                const validation = SearchResultSchema.safeParse(item);
                expect(validation.success).toBe(true);
            });
        });
    });
});
