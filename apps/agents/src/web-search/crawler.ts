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
                engines: process.env.SEARXNG_ENGINES || "",
                categories: process.env.SEARXNG_CATEGORIES || "",
                pageno: String(options.page ?? 1),
                format: "json",
            });

            if (options.lang) {
                params.append("language", options.lang);
            }

            const url = process.env.SEARXNG_ENDPOINT!;
            const cleanedUrl = url.endsWith("/") ? url.slice(0, -1) : url;
            const finalUrl = cleanedUrl + "/search";

            const response = await fetch(finalUrl + "?" + params.toString(), {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data && Array.isArray(data.results)) {
                return {
                    status: "success",
                    results: data.results.map((a: any) => ({
                        url: a.url,
                        title: a.title,
                        description: a.content,
                    })),
                    timestamp: new Date().toISOString(),
                };
            } else {
                return {
                    status: "success",
                    results: [],
                    timestamp: new Date().toISOString(),
                };
            }
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
        description: "使用 SearXNG 搜索引擎进行网络搜索",
        schema: z.object({
            query: z.string().describe("search keywords"),
            options: z.object({
                lang: z.string().optional().describe("search language").default("zh-CN"),
                page: z.number().optional().describe("page number").default(1),
                num_results: z.number().describe("expected results number").default(10),
            }),
        }),
    }
);
