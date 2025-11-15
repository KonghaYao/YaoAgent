import { handleExtractRequest, handleSearchRequest, handleFavicon } from "../dist/index";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();
app.use(logger());

app.post("/extract", (c) => handleExtractRequest(c.req.raw));
app.post("/search", (c) => handleSearchRequest(c.req.raw));
app.get("/favicon/:domain", (c) => handleFavicon(c.req.raw));

export default app;
