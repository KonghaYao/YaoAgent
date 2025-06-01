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
            return text;
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
        description:
            "A powerful web content extraction tool that retrieves and processes raw content from specified URLs, ideal for data collection, content analysis, and research tasks.",
        schema: z.object({
            url: z.string().url().describe("the url of the website"),
        }),
    }
);

export const web_search_tool = tool(
    async ({ query, pageNo }) => {
        try {
            const params = new URLSearchParams({
                q: query,
                safesearch: "0",
                category_general: "1",
                pageno: String(pageNo ?? 1),
                theme: "simple",
                language: "all",
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
        description:
            "A powerful web search tool that provides comprehensive, real-time results using search engine. Returns relevant web content with customizable parameters for result count, content type, and domain filtering. Ideal for gathering current information, news, and detailed web content analysis.",
        schema: z.object({
            query: z.string().describe("search keywords"),
            pageNo: z.number().optional().describe("page number").default(1),
            pageSize: z.number().describe("expected results number").default(10),
        }),
    }
);
