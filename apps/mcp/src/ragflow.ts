import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

const server = new McpServer(
    {
        name: "知识库助手",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);
server.tool(
    "search_knowledge_base",
    "搜索知识库，从知识库中返回特定的知识",
    {
        query: z.string(),
        dataset_ids: z.string().array(),
    },
    async (args) => {
        const headers = new Headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RAGFLOW_TOKEN}`,
        });

        const requestBody = {
            question: args.query,
            dataset_ids: args.dataset_ids,
        };

        try {
            const response = await fetch(`${process.env.RAGFLOW_BASE_URL}/retrieval`, {
                method: "POST",
                headers,
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.code !== 0) {
                throw new Error(`API error: ${data.message || "Unknown error"}`);
            }

            const chunks = data.data.chunks || [];
            const formattedText = chunks
                .map((chunk: any, index: number) => {
                    const content = chunk.content.replace(/\r\n/g, "\n").trim();
                    const source = chunk.document_keyword || "Unknown";
                    const similarity = (chunk.similarity * 100).toFixed(2);

                    return `${index + 1}. ${content}\n\n来源: ${source}\n相关度: ${similarity}%`;
                })
                .join("\n\n---\n\n");

            return {
                content: [
                    {
                        type: "text",
                        text: formattedText || "未找到相关内容",
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `搜索出错: ${error instanceof Error ? error.message : "未知错误"}`,
                    },
                ],
            };
        }
    }
);

server.tool(
    "list_knowledge_base",
    "获取知识库的列表，帮助你发现一些文档",
    {
        page: z.number().optional().default(1),
        page_size: z.number().optional().default(10),
        orderby: z.string().optional().default("create_time"),
        desc: z.boolean().optional().default(true),
        name: z.string().optional(),
    },
    async (args) => {
        const headers = new Headers({
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.RAGFLOW_TOKEN}`,
        });

        const queryParams = new URLSearchParams({
            page: args.page.toString(),
            page_size: args.page_size.toString(),
            orderby: args.orderby,
            desc: args.desc.toString(),
            ...(args.name && { name: args.name }),
        });

        try {
            const response = await fetch(`${process.env.RAGFLOW_BASE_URL}/datasets?${queryParams}`, {
                method: "GET",
                headers,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.code !== 0) {
                throw new Error(`API error: ${data.message || "Unknown error"}`);
            }

            const formattedText = data.data
                .map((dataset: any, index: number) => {
                    return `${index + 1}. ${dataset.name}
ID: ${dataset.id}
描述: ${dataset.description || "无"}
文档数: ${dataset.document_count}
创建时间: ${new Date(dataset.create_time).toLocaleString()}
更新时间: ${new Date(dataset.update_time).toLocaleString()}
语言: ${dataset.language}`;
                })
                .join("\n\n");

            return {
                content: [
                    {
                        type: "text",
                        text: formattedText || "未找到知识库",
                    },
                ],
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: `获取知识库列表出错: ${error instanceof Error ? error.message : "未知错误"}`,
                    },
                ],
            };
        }
    }
);

export default server;
