import { handleExtractRequest, handleSearchRequest, handleFavicon } from "../src/index.ts";
import { Hono } from "https://esm.sh/hono";
import { logger } from "https://esm.sh/hono/logger";

const app = new Hono();
app.use(logger());

app.post("/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/search", (c) => handleSearchRequest(c.req.raw));
app.get("/favicon/:domain", (c) => handleFavicon(c.req.raw));
Deno.serve(app.fetch);
