import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";
import "dotenv/config";
import { useContext } from "./context.js";
const server = new McpServer(
    {
        name: "网络助手",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);
server.tool(
    "search_website",
    "使用搜索引擎搜索网站",
    {
        query: z.string(),
        freshness: z.enum(["oneDay", "oneWeek", "oneMonth", "oneYear", "noLimit"]).optional().default("noLimit"),
        summary: z.boolean().optional().default(false),
        count: z.number().min(1).max(50).optional().default(10),
        page: z.number().min(1).optional().default(1),
    },
    async (args, extra) => {
        const info = useContext(extra);
        console.log(info);
        const res = await fetch("https://api.langsearch.com/v1/web-search", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${info["x-search-key"] || process.env.SEARCH_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(args),
        });
        const data = await res.json();
        return {
            content: [
                {
                    type: "text",
                    text: data.data.webPages.value.map((item: any, index: number) => `${index}. ${item.name}\n${item.url}\n${item.snippet}`).join("\n\n"),
                },
            ],
        };
    }
);

server.tool("search_coding_hot_articles", "获取编程相关的热门文章", async (args) => {
    const res = await fetch(`https://api.juejin.cn/content_api/v1/content/article_rank?category_id=1&type=hot`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    });
    const data = await res.json();
    return {
        content: [
            {
                type: "text",
                text: data.data
                    .map((item: any, index: number) => `${index + 1}. [${item.content.title}](https://juejin.cn/post/${item.content.content_id})\n作者ID: ${item.content.author_id}`)
                    .join("\n"),
            },
        ],
    };
});

server.tool("get_recommended_articles", "获取编程推荐文章", async (args) => {
    const res = await fetch("https://api.juejin.cn/recommend_api/v1/article/recommend_all_feed", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
            id_type: 2,
        }),
    });
    const data = await res.json();
    return {
        content: [
            {
                type: "text",
                text: data.data
                    .map(
                        (item: any, index: number) =>
                            `${index + 1}. [${item.item_info.article_info.title}](https://juejin.cn/post/${item.item_info.article_id})

${item.item_info.article_info.brief_content}

点赞数: ${item.item_info.article_info.digg_count}
                
标签：${item.item_info.tags.map((i: any) => i.tag_name).join(",")}`
                    )
                    .join("\n\n"),
            },
        ],
    };
});

export default server;
