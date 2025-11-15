import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { search, SearchSchema } from "../search.js";
import { extract, ExtractSchema } from "../extract.js";
import z from "zod";
export const mcpServer = new McpServer({
    name: "tavily-like-server",
    version: "1.0.0",
});

mcpServer.registerTool(
    "tavily-search",
    {
        title: "tavily-search",
        description:
            "A real-time web search tool powered by Tavily's AI engine. Features include customizable search depth (basic/advanced), domain filtering, time-based filtering, and support for both general and news-specific searches. Returns comprehensive results with titles, URLs, content snippets, and optional image results.",
        inputSchema: SearchSchema,
    },
    async (args) => {
        const result = await search(args);
        return {
            content: [{ type: "text", text: JSON.stringify(result) }],
        };
    }
);
mcpServer.registerTool(
    "tavily-extract",
    {
        title: "tavily-extract",
        description:
            "Extracts and processes content from specified URLs with advanced parsing capabilities. Supports both basic and advanced extraction modes, with the latter providing enhanced data retrieval including tables and embedded content. Ideal for data collection, content analysis, and research tasks.",
        inputSchema: ExtractSchema,
    },
    async (args) => {
        const result = await extract(args as z.infer<typeof ExtractSchema>);
        return {
            content: [{ type: "text", text: JSON.stringify(result) }],
        };
    }
);
