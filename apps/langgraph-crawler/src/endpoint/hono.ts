import { handleExtractRequest, handleSearchRequest, handleFavicon, SearchSchema, search, extract, ExtractSchema } from "../index.js";
import { Hono } from "hono";
import { StreamableHTTPTransport } from "@hono/mcp";
import { logger } from "hono/logger";
import { z } from "zod";
import { cors } from "hono/cors";
import { mcpServer } from "./mcp.js";
const app = new Hono();
app.use(logger());

app.post("/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/search", (c) => handleSearchRequest(c.req.raw));
app.get("/favicon/:domain", (c) => handleFavicon(c.req.raw));
app.use(cors());
app.all("/mcp", async (c) => {
    const transport = new StreamableHTTPTransport();
    await mcpServer.connect(transport);
    return transport.handleRequest(c);
});

export default app;
