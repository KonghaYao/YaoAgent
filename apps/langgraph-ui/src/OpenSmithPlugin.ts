import { Plugin } from "vite";
import { Readable } from "stream";
import { app } from "@langgraph-js/open-smith/dist/app.js";
export const OpenSmithPlugin = () =>
    ({
        name: "open-smith",
        configureServer(server) {
            server.middlewares.use("/api/open-smith", async (req, res, next) => {
                try {
                    const body = Readable.toWeb(req);
                    // Build a compatible Request for Fetch API
                    const url = `http://localhost${req.url}`;
                    const fetchRequest = new Request(url, {
                        method: req.method,
                        headers: req.headers as any,
                        body: req.method && !["GET", "HEAD"].includes(req.method.toUpperCase()) && body ? (body as any) : undefined,
                        ...(req.method && !["GET", "HEAD"].includes(req.method.toUpperCase()) && body ? { duplex: "half" as const } : {}),
                    });

                    // Proxy the request to app.basePath handler
                    const response = await app.basePath("/api/open-smith").fetch(fetchRequest);

                    // Set status and headers
                    res.statusCode = response.status;
                    // @ts-ignore
                    for (const [key, value] of response.headers.entries()) {
                        res.setHeader(key, value);
                    }

                    // Send the response body
                    const arrayBuffer = await response.arrayBuffer();
                    res.end(Buffer.from(arrayBuffer));
                } catch (error) {
                    console.log(error);
                }
            });
        },
    }) as Plugin;
