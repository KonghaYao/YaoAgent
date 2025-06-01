import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const crawler_tool = tool(
    async ({ url }) => {
        try {
            if (!url) {
                return {
                    status: "error",
                    error: "URL is required",
                };
            }

            const response = await fetch(`${process.env.SERVER_URL || "http://localhost:8123"}/website-to-md`, {
                method: "POST",
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            return {
                status: "success",
                content: text,
                url,
                timestamp: new Date().toISOString(),
            };
        } catch (error) {
            return {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
                url,
                timestamp: new Date().toISOString(),
            };
        }
    },
    {
        name: "crawl_tool",
        description: "Use this to crawl a url and get a readable content in markdown format.",
        schema: z.object({
            url: z.string().url().describe("the url of the website"),
        }),
    }
);
interface SearchOptions {
    tbs?: string;
    filter?: string;
    lang?: string;
    country?: string;
    location?: string;
    num_results: number;
    page?: number;
}

export const web_search_tool = tool(
    async ({ query, options }: { query: string; options: SearchOptions }) => {
        try {
            const params = new URLSearchParams({
                q: query,
                safesearch: "0",
                category_general: "1",
                pageno: String(options.page ?? 1),
                theme: "simple",
                language: options.lang ?? "all",
            });

            const url = process.env.SEARXNG_ENDPOINT!;
            const cleanedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
            const finalUrl = cleanedUrl + "/search";

            const response = await fetch(`${process.env.SERVER_URL || "http://localhost:8123"}/website-to-md`, {
                method: "POST",
                body: JSON.stringify({
                    url: finalUrl + "?" + params.toString(),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.text();
        } catch (error) {
            // logger.error(`There was an error searching for content`, { error });
            return {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
                timestamp: new Date().toISOString(),
            };
        }
    },
    {
        name: "web_search_tool",
        description: "use english search engine to search the web, please use keywords to search the web",
        schema: z.object({
            query: z.string().describe("search keywords"),
            options: z.object({
                page: z.number().optional().describe("page number").default(1),
                num_results: z.number().describe("expected results number").default(10),
            }),
        }),
    }
);
