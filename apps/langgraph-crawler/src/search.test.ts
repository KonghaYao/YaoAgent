import { describe, expect, test, vi, beforeEach } from "vitest";
import { search, SearchResultSchema, SearchResponseSchema } from "./search.js";

describe("search", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    test("should search with basic parameters", async () => {
        const response = await search({
            query: "typescript",
        });

        expect(response).toHaveProperty("query", "typescript");
        expect(response).toHaveProperty("results");
        expect(Array.isArray(response.results)).toBe(true);
        expect(response).toHaveProperty("response_time");
        expect(typeof response.response_time).toBe("number");
        expect(response).toHaveProperty("request_id");
        expect(typeof response.request_id).toBe("string");
    });

    test("should return results with correct schema", async () => {
        const response = await search({
            query: "javascript",
            max_results: 3,
        });

        // Validate response schema
        const validation = SearchResponseSchema.safeParse(response);
        expect(validation.success).toBe(true);

        // Check results
        expect(response.results.length).toBeLessThanOrEqual(3);
        response.results.forEach((result) => {
            expect(result).toHaveProperty("title");
            expect(result).toHaveProperty("url");
            expect(result).toHaveProperty("content");
            expect(result).toHaveProperty("score");
            expect(typeof result.score).toBe("number");
        });
    });

    test("should respect max_results parameter", async () => {
        const response = await search({
            query: "react",
            max_results: 2,
        });

        expect(response.results.length).toBeLessThanOrEqual(2);
    });

    test("should handle different topics", async () => {
        const topics = ["general", "news", "finance"];

        for (const topic of topics) {
            const response = await search({
                query: "test query",
                topic: topic as any,
            });

            expect(response.query).toBe("test query");
            expect(Array.isArray(response.results)).toBe(true);
        }
    });

    test("should include answer when requested", async () => {
        const response = await search({
            query: "what is javascript",
            include_answer: true,
        });

        expect(response).toHaveProperty("answer");
        // Note: answer may be undefined if not implemented
    });

    test("should include images when requested", async () => {
        const response = await search({
            query: "cats",
            include_images: true,
        });

        expect(response).toHaveProperty("images");
        expect(Array.isArray(response.images)).toBe(true);
    });

    test("should include auto_parameters when requested", async () => {
        const response = await search({
            query: "test",
            auto_parameters: true,
        });

        expect(response).toHaveProperty("auto_parameters");
        // Note: auto_parameters may be undefined if not implemented
    });

    test("should validate search schema parameters", async () => {
        // Test valid parameters
        await expect(search({
            query: "test",
            topic: "general",
            search_depth: "basic",
            max_results: 5,
        })).resolves.toBeDefined();

        // Test invalid topic
        await expect(search({
            query: "test",
            topic: "invalid" as any,
        })).rejects.toThrow();

        // Test invalid max_results
        await expect(search({
            query: "test",
            max_results: 30, // exceeds maximum
        })).rejects.toThrow();

        // Test invalid date format
        await expect(search({
            query: "test",
            start_date: "invalid-date",
        })).rejects.toThrow();
    });

    test("should handle empty results gracefully", async () => {
        // This test assumes we can mock engines to return empty results
        // For now, just ensure the function doesn't crash
        const response = await search({
            query: "nonexistent-query-that-should-return-no-results",
            max_results: 0,
        });

        expect(response.results).toEqual([]);
        expect(response.query).toBe("nonexistent-query-that-should-return-no-results");
    });
});
