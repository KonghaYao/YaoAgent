import testModelApp from "./test-for-model";
import { Hono } from "hono";
import LangGraphApp from "@langgraph-js/pure-graph/dist/adapter/hono/index.js";
import { registerGraph } from "@langgraph-js/pure-graph";
import { graph } from "./graph/debugAgent";

export default (app: Hono) => {
    registerGraph("graph", graph);
    app.route("/llm", testModelApp);
    app.route("/graph", LangGraphApp);
    return app;
};
