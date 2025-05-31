import { tool } from "@langchain/core/tools";
import { z } from "zod";

export function createLangSearchTool(apiKey: string) {
    const langSearchTool = tool(
        async ({ query, freshness = "noLimit", count = 10 }) => {
            try {
                const response = await fetch("https://api.langsearch.com/v1/web-search", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        query,
                        freshness,
                        summary: false,
                        count,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(`搜索失败: ${errorData.msg || response.statusText}`);
                }

                const responseData = await response.json();
                const data = responseData.data;
                if (!data || !data.webPages || !data.webPages.value) {
                    return "未找到相关搜索结果";
                }

                const results = data.webPages.value
                    .map((item: any) => {
                        const { name, url, snippet, summary } = item;
                        return `标题: ${name}\n链接: ${url}\n摘要: ${snippet}${summary ? `\n详细内容: ${summary}` : ""}`;
                    })
                    .join("\n---\n");

                return results || "未找到相关搜索结果";
            } catch (error) {
                throw error instanceof Error ? error : new Error(`搜索失败: ${String(error)}`);
            }
        },
        {
            name: "lang_web_search_tool",
            description: "网络搜索工具，可以搜索最新的网络信息",
            schema: z.object({
                query: z.string().describe("搜索查询内容"),
                freshness: z
                    .enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"])
                    .optional()
                    .describe(
                        "搜索结果的时间范围：oneDay-24小时内/oneWeek-一周内/oneMonth-一个月内/oneYear-一年内/noLimit-不限时间"
                    ),
                count: z.number().optional().describe("返回结果数量（1-10）"),
            }),
        }
    );

    return [langSearchTool];
}
