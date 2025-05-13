import { startServer } from "@langgraph-js/api/server";
import fs from "node:fs";
import path from "node:path";
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "langgraph.node.json"), "utf8"));
const schema = {
    port: 8123,
    nWorkers: 1,
    host: "0.0.0.0",
    cwd: process.cwd(),
    ...config,
};
const result = await startServer(schema);
console.log("LangGraph is running on http://" + result.host);
console.log(process.cwd());
