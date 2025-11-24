import { Hono } from "hono";
import LangGraphApp from "@langgraph-js/pure-graph/dist/adapter/hono/index.js";
import { registerGraph } from "@langgraph-js/pure-graph";
import { graph } from "./graph";

registerGraph("graph", graph);
const app = new Hono();
app.route("/", LangGraphApp);
export default app;
