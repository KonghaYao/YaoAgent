import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const meilisearchTool = tool(
    async ({ query, filter, sort, limit = 20, offset = 0 }) => {
        try {
            const url = `${process.env.MEILISEARCH_HOST}/indexes/${process.env.MEILISEARCH_INDEX}/search`;
            const headers: Record<string, string> = {
                "Content-Type": "application/json",
                Authorization: `Bearer ${process.env.MEILISEARCH_API_KEY}`,
            };

            const searchParams: Record<string, any> = {
                q: query || "",
                limit: limit,
                offset: offset,
                attributesToHighlight: ["title", "content"],
                highlightPreTag: '<span class="highlight">',
                highlightPostTag: "</span>",
                attributesToCrop: ["content"],
                cropLength: 200,
                attributesToRetrieve: ["title", "path", "tags", "id"],
            };

            if (filter) {
                searchParams.filter = filter;
            }

            if (sort) {
                searchParams.sort = sort;
            }

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(searchParams),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`Meilisearch 搜索失败: ${errorData.message || response.statusText}`);
            }

            const data = await response.json();

            if (!data || !data.hits || data.hits.length === 0) {
                return "未找到相关搜索结果";
            }

            // 格式化结果
            const totalHits = data.estimatedTotalHits || data.totalHits || data.hits.length;
            const processingTimeMs = data.processingTimeMs || 0;

            const formattedResults = data.hits
                .map((hit: any, index: number) => {
                    const { id, title, path, tags, _formatted } = hit;

                    let content = "";
                    if (_formatted && _formatted.content) {
                        content = _formatted.content;
                        // 如果内容过长，截断显示
                        if (content.length > 300) {
                            content = content.substring(0, 300) + "...";
                        }
                    }

                    return `结果 #${index + 1} ${id}:\n标题: ${title}\n路径: ${path}\n标签: ${tags.join(", ")}\n摘要: ${content}`;
                })
                .join("\n---\n");

            return `找到 ${totalHits} 个结果 (耗时 ${processingTimeMs}ms):\n\n${formattedResults}`;
        } catch (error) {
            throw error instanceof Error ? error : new Error(`Meilisearch 搜索失败: ${String(error)}`);
        }
    },
    {
        name: "documents_search",
        description: "在 Meilisearch 索引中搜索文档",
        schema: z.object({
            query: z.string().optional().describe("搜索查询的关键字"),
            filter: z
                .union([z.string(), z.array(z.string())])
                .optional()
                .describe("过滤条件，用于按属性值筛选结果"),
            tag: z
                .enum(["产品-运营", "前端-移动", "后端-架构", "运维-测试", "计算机基础", "管理-成长", "AI-大数据"])
                .optional()
                .describe("标签，用于按标签筛选结果"),
            sort: z.array(z.string()).optional().describe("排序条件，用于按属性值排序结果"),
            limit: z.number().optional().describe("返回结果的最大数量，默认为20"),
            offset: z.number().optional().describe("跳过的结果数量，用于分页"),
        }),
    }
);

export const crawlSingleDocument = tool(
    async ({ id }) => {
        const url = `${process.env.MEILISEARCH_HOST}/indexes/${process.env.MEILISEARCH_INDEX}/documents/${id}`;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.MEILISEARCH_API_KEY}`,
        };
        const response = await fetch(url, {
            method: "GET",
            headers,
        });
        if (!response.ok) {
            throw new Error(`Meilisearch 爬取单个文档失败: ${response.statusText}`);
        }
        const data = await response.json();
        return data.content;
    },
    {
        name: "crawl_single_document",
        description: "爬取单个文档，返回文档内容",
        schema: z
            .object({
                id: z.string().describe("文档ID"),
            })
            .describe("爬取单个文档，返回文档内容"),
    }
);
