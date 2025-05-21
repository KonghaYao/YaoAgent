import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

export function createLangSearchTool(apiKey: string) {
    const langSearchTool = tool(
        async ({ query, freshness = "noLimit", summary = false, count = 10 }) => {
            try {
                const response = await axios.post(
                    "https://api.langsearch.com/v1/web-search",
                    {
                        query,
                        freshness,
                        summary,
                        count,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                const data = response.data.data;
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
                if (axios.isAxiosError(error)) {
                    throw new Error(`搜索失败: ${error.response?.data?.msg || error.message}`);
                }
                throw error;
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
                summary: z.boolean().optional().describe("是否返回详细摘要"),
                count: z.number().optional().describe("返回结果数量（1-10）"),
            }),
        }
    );

    return [langSearchTool];
}
