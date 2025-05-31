import { tool } from "@langchain/core/tools";
import { z } from "zod";

interface JuejinSearchResult {
    err_no: number;
    err_msg: string;
    data: Array<{
        result_type: number;
        result_model: {
            article_id: string;
            article_info: {
                title: string;
                brief_content: string;
                view_count: number;
                digg_count: number;
                comment_count: number;
                collect_count: number;
                read_time: string;
            };
            author_user_info: {
                user_name: string;
                company: string;
                job_title: string;
            };
            category: {
                category_name: string;
            };
            tags: Array<{
                tag_name: string;
            }>;
        };
        title_highlight: string;
        content_highlight: string;
    }>;
}

export const juejin_search_tool = tool(
    async ({ query, cursor = "0", limit }: { query: string; cursor?: string; limit?: number }) => {
        try {
            const params = new URLSearchParams({
                spider: "0",
                query,
                id_type: "0",
                cursor,
                limit: String(limit),
                search_type: "0",
                sort_type: "0",
                version: "1",
            });

            const response = await fetch(`https://api.juejin.cn/search_api/v1/search?${params.toString()}`, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = (await response.json()) as JuejinSearchResult;

            if (data.err_no === 0) {
                return {
                    status: "success",
                    results: data.data.map((item) => ({
                        title: item.result_model.article_info.title,
                        brief: item.result_model.article_info.brief_content,
                        author: {
                            name: item.result_model.author_user_info.user_name,
                            company: item.result_model.author_user_info.company,
                            job: item.result_model.author_user_info.job_title,
                        },
                        stats: {
                            views: item.result_model.article_info.view_count,
                            likes: item.result_model.article_info.digg_count,
                            comments: item.result_model.article_info.comment_count,
                            collects: item.result_model.article_info.collect_count,
                            readTime: item.result_model.article_info.read_time,
                        },
                        category: item.result_model.category.category_name,
                        tags: item.result_model.tags.map((tag) => tag.tag_name),
                        url: `https://juejin.cn/post/${item.result_model.article_id}`,
                    })),
                    timestamp: new Date().toISOString(),
                };
            } else {
                return {
                    status: "error",
                    error: data.err_msg,
                    timestamp: new Date().toISOString(),
                };
            }
        } catch (error) {
            return {
                status: "error",
                error: error instanceof Error ? error.message : "Unknown error occurred",
                timestamp: new Date().toISOString(),
            };
        }
    },
    {
        name: "juejin_search_tool",
        description: "使用掘金搜索 API 搜索技术文章",
        schema: z.object({
            query: z.string().describe("搜索关键词"),
            cursor: z.string().optional().describe("分页游标").default("0"),
            limit: z.number().optional().describe("每页结果数量").default(20),
        }),
    }
);
