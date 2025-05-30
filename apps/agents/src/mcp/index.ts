import { Hono } from "hono";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { toFetchResponse, toReqRes } from "fetch-to-node";
import context7 from "./context7.js";
import { handleRequest } from "@langgraph-js/crawler";
export const app = new Hono();

const servers = {
    context7,
};

app.post("/mcp/:name", async (c) => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
    });
    const server = servers[c.req.param("name") as keyof typeof servers];
    if (!server) {
        return c.json({ error: "Server not found" }, 404);
    }
    await server.connect(transport);
    const { req, res } = toReqRes(c.req.raw);
    await transport.handleRequest(req, res, await c.req.json());
    return toFetchResponse(res);
});

app.post("/website-to-md", async (c) => {
    return handleRequest(c.req.raw);
});
