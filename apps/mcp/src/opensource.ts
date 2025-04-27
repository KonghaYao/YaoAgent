import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import { EventSource } from "eventsource";
const server = new McpServer(
    {
        name: "开源代码搜索器",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);
server.tool(
    "search_open_source_code",
    "搜索开源代码",
    {
        query: z.string(),
    },
    async (args) => {
        const matches: SourcegraphMatch[] = [];
        // 创建 EventSource 实例
        const events = new EventSource(`https://sourcegraph.com/.api/search/stream?q=context:global+${encodeURIComponent(args.query)}&v=V3&t=keyword&sm=0&display=1500&cm=t&max-line-len=5120`);

        // 监听 matches 事件
        events.addEventListener("matches", (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data instanceof Array) {
                    matches.push(...data);
                }
            } catch (error) {
                console.warn("解析 SSE 数据失败:", error);
            }
        });

        // 等待所有数据接收完成
        await new Promise((resolve, reject) => {
            events.addEventListener("error", () => {
                events.close();
                resolve(null);
            });
            events.addEventListener("end", () => {
                events.close();
                resolve(null);
            });
        });

        return {
            content: [
                {
                    type: "text",
                    text: matches
                        .map(
                            (match, index: number) =>
                                `${index}. ${match.path}
[${match.repository}](https://sourcegraph.com/${match.repository}) 星标数: ${match.repoStars || 0}
下面是匹配的数据：

${match.chunkMatches
    ?.map((chunk) => {
        return `\`\`\`${match.language?.toLocaleLowerCase()}\n${chunk.content}\n\`\`\``;
    })
    .join("\n")}`
                        )
                        .join("\n---\n"),
                },
            ],
        };
    }
);
export default server;

interface SourcegraphMatch {
    repository: string;
    language?: string;
    repoStars?: number;
    path: string;
    chunkMatches?: Array<{ content: string }>;
    lineMatches?: Array<{ preview: string }>;
}
