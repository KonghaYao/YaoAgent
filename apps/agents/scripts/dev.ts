import { startServer } from "@langgraph-js/api/server";
import fs from "fs";
import path from "path";
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "langgraph.json"), "utf8"));
const result = await startServer({
    port: 8123,
    nWorkers: 1,
    host: "0.0.0.0",
    cwd: process.cwd(),
    ...config,
});
console.log("LangGraph is running on http://" + result.host);
console.log(process.cwd());
