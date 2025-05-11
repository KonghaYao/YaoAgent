import { createHonoServer } from "@langgraph-js/api/server";
import fs from "node:fs";
import path from "node:path";
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "langgraph.json"), "utf8"));
const schema = {
    cwd: process.cwd(),
    ...config,
};
const result = await createHonoServer(schema);

export default {
    fetch: result.app.fetch as any,
};
