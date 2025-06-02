import { Hono } from "hono";
import { handleRequest } from "@langgraph-js/crawler";
const app = new Hono<{ Bindings: CloudflareBindings }>();

app.get("/message", (c) => {
    return c.text("Hello Hono!");
});
app.post("/website-to-md", async (c) => {
    return handleRequest(c.req.raw);
});

export default app;
