import { tool } from "@langchain/core/tools";
import { z } from "zod";

// Helper function to create a mock search result item
const createMockSearchResultItem = (id: number, query: string, useSummary: boolean) => {
    const name = `Mock Search Result ${id} for \"${query}\""`;
    const url = `https://mocksite.com/search?q=${encodeURIComponent(query)}&id=${id}`;
    const snippet = `This is a mock snippet for search result ${id} related to \"${query}\". It provides a brief overview.`;
    const detailedSummary = `This is the detailed mock summary for result ${id}. It elaborates further on the topic of \"${query}\", providing more context and information than the snippet.`;
    return `标题: ${name}\n链接: ${url}\n摘要: ${snippet}${useSummary ? `\n详细内容: ${detailedSummary}` : ""}`;
};

export const web_search_tool = tool(
    async ({ query, freshness = "noLimit", summary = false, count = 3 }) => {
        // console.log(`Mock search called with: query="${query}", freshness="${freshness}", summary=${summary}, count=${count}`);

        if (query.toLowerCase().includes("empty")) {
            return "未找到相关搜索结果";
        }

        const results = [];
        // Ensure count is between 1 and 10, default to 3 if not specified or out of range for mock
        const effectiveCount = Math.min(Math.max(1, count || 3), 10);

        for (let i = 1; i <= effectiveCount; i++) {
            results.push(createMockSearchResultItem(i, query, summary));
        }

        return results.join("\n---\n") || "未找到相关搜索结果";
    },
    {
        name: "web_search_tool",
        description: "网络搜索工具，可以搜索最新的网络信息 (返回模拟数据)",
        schema: z.object({
            query: z.string().describe("搜索查询内容"),
            freshness: z
                .enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"])
                .optional()
                .describe(
                    "搜索结果的时间范围：oneDay-24小时内/oneWeek-一周内/oneMonth-一个月内/oneYear-一年内/noLimit-不限时间"
                ),
            summary: z.boolean().optional().describe("是否返回详细摘要"),
            count: z.number().optional().describe("返回结果数量（1-10）"),
        }),
    }
);
