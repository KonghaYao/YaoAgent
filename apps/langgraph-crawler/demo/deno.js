import { handleExtractRequest, handleSearchRequest } from "../src/index.ts";
import { Hono } from "https://esm.sh/hono";

const app = new Hono();

app.post("/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/search", (c) => handleSearchRequest(c.req.raw));
Deno.serve(app.fetch);
