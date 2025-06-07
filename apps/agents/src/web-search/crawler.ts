import { tool } from "@langchain/core/tools";
import { ExtractSchema, SearchSchema } from "@langgraph-js/crawler";
import { z } from "zod";

export const crawler_tool = tool(
    async ({ url }) => {
        if (!url) {
            return {
                status: "error",
                error: "URL is required",
            };
        }

        const response = await fetch(`${process.env.SERVER_URL || "http://localhost:8123"}/website-to-md/extract`, {
            method: "POST",
            body: JSON.stringify({ url }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return text;
    },
    {
        name: "crawl_tool",
        description:
            "A powerful web content extraction tool that retrieves and processes raw content from specified URLs, ideal for data collection, content analysis, and research tasks.",
        schema: z.object(ExtractSchema.shape),
    }
);

export const web_search_tool = tool(
    async ({ query, engines }) => {
        const response = await fetch(`${process.env.SERVER_URL || "http://localhost:8123"}/website-to-md/search`, {
            method: "POST",
            body: JSON.stringify({
                query,
                engines,
                returnType: "json",
                withMetadata: true,
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.text();
    },
    {
        name: "web_search_tool",
        description:
            "A powerful web search tool that provides comprehensive, real-time results using search engine. Returns relevant web content with customizable parameters for result count, content type, and domain filtering. Ideal for gathering current information, news, and detailed web content analysis.",
        schema: z.object(SearchSchema.shape),
    }
);
