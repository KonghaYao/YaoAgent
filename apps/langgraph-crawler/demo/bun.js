import { handleRequest } from "../src/index.ts";

Bun.serve({ port: 3021, fetch: handleRequest });
