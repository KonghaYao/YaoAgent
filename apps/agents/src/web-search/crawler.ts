import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const crawlerTool = tool(
    async ({ url }) => {
        try {
            if (!url) {
                return {
                    status: "error",
                    error: "URL is required",
                };
            }

            const response = await fetch(`${process.env.SERVER_URL}/website-to-md`, {
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
        name: "web_crawler",
        description: "网页爬虫工具，可以抓取网页内容并转换为 Markdown 格式",
        schema: z.object({
            url: z.string().url().describe("要爬取的网页 URL"),
        }),
    }
);
