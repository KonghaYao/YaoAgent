import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import z from "zod";

const server = new McpServer(
    {
        name: "NPM查询助手",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);
server.tool(
    "search_npm",
    "搜索 npm 内的包",
    {
        query: z.string(),
    },
    async (args) => {
        const res = await fetch(`https://registry.npmmirror.com/-/v1/search?text=${encodeURIComponent(args.query)}&size=12&from=0`, {
            method: "GET",
            headers: {
                accept: "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                origin: "https://npmmirror.com",
                referer: "https://npmmirror.com/",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            },
        });
        const data = await res.json();
        return {
            content: [
                {
                    type: "text",
                    text: data.objects
                        .map(
                            (item: any, index: number) =>
                                `${index}. [${item.package.name}](https://www.npmjs.com/package/${item.package.name}) 版本: ${item.package.version}\n${item.package.description}`
                        )
                        .join("\n\n"),
                },
            ],
        };
    }
);
server.tool(
    "get_npm_package_info",
    "获取 npm 包的信息",
    {
        package_name: z.string(),
    },
    async (args) => {
        const res = await fetch(`https://registry.npmmirror.com/${encodeURIComponent(args.package_name)}`, {
            method: "GET",
            headers: {
                accept: "*/*",
                "accept-language": "zh-CN,zh;q=0.9",
                origin: "https://npmmirror.com",
                referer: "https://npmmirror.com/",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
            },
        });
        const data = await res.json();
        return {
            content: [
                {
                    type: "text",
                    text: data.readme,
                },
            ],
        };
    }
);

export default server;
