import { Plugin } from "vite";
import { Readable } from "stream";
import { app } from "@langgraph-js/open-smith/dist/app.js";
import appendLLMRouter from "../server/index";
export const OpenSmithPlugin = () =>
    ({
        name: "open-smith",
        configureServer(server) {
            console.log("open-smith is open on http://localhost:4173/api/open-smith/ui/index.html");
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
                    const response = await appendLLMRouter(app).basePath("/api/open-smith").fetch(fetchRequest);

                    // Set status and headers
                    res.statusCode = response.status;
                    // @ts-ignore
                    for (const [key, value] of response.headers.entries()) {
                        res.setHeader(key, value);
                    }

                    // 使用 Web Stream API 流式转发响应
                    if (response.body) {
                        const reader = response.body.getReader();

                        try {
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;

                                // 将 Uint8Array 直接写入响应流
                                res.write(Buffer.from(value));
                            }
                            res.end();
                        } finally {
                            reader.releaseLock();
                        }
                    } else {
                        res.end();
                    }
                } catch (error) {
                    console.log(error);
                }
            });
        },
    }) as Plugin;
