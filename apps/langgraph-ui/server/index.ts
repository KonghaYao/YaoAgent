import { Hono } from "hono";
import testModelApp from "./test-for-model";

export default (app: Hono) => {
    app.route("/llm", testModelApp);
    return app;
};
