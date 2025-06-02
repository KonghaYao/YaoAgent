import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extract, ExtractSchema, search, SearchSchema } from "@langgraph-js/crawler";

// Create an MCP server
const server = new McpServer({
    name: "langgraph-crawler",
    version: "1.0.0",
});

server.tool(
    "crawl_tool",
    "A powerful web content extraction tool that retrieves and processes raw content from specified URLs, ideal for data collection, content analysis, and research tasks.",
    ExtractSchema.shape,
    async (request) => {
        const content = await extract(request);
        return {
            content: [{ type: "text", text: content }],
        };
    }
);

server.tool(
    "web_search_tool",
    "A powerful web search tool that provides comprehensive, real-time results using search engine. Returns relevant web content with customizable parameters for result count, content type, and domain filtering. Ideal for gathering current information, news, and detailed web content analysis.",
    SearchSchema.shape,
    async (request) => {
        const content = await search(request);
        return {
            content: [{ type: "text", text: typeof content === "string" ? content : JSON.stringify(content) }],
        };
    }
);

export default server;
