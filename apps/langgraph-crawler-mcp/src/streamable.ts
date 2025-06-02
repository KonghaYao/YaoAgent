import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import server from "./index.js";

const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
});
server.connect(transport);
