import { handleRequest } from "../dist/index.js";

const server = Bun.serve({
    port: 3021,
    fetch: handleRequest,
});

console.log(`Server is running on ${server.url}`);
