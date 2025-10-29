import react from "@vitejs/plugin-react";
import { defineConfig, Plugin } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwindcss from "@tailwindcss/vite";
import { app } from "@langgraph-js/open-smith/dist/app.js";
import { Readable } from "stream";
const OpenSmithPlugin = () =>
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
                        body: req.method && !["GET", "HEAD"].includes(req.method.toUpperCase()) && body ? body : undefined,
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

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isHttps = mode === "https";
    return {
        plugins: [react(), tailwindcss(), isHttps ? basicSsl() : undefined, OpenSmithPlugin()],
        resolve: {
            alias: {
                "@langgraph-js/sdk": new URL("../langgraph-client/src", import.meta.url).pathname,
                "@/": new URL("./src/", import.meta.url).pathname,
            },
        },
        optimizeDeps: {
            exclude: ["@langgraph-js/ui", "@langgraph-js/sdk"],
        },
        server: {
            proxy: {
                "/api/langgraph": {
                    target: "http://localhost:8123",
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api\/langgraph/, ""),
                },
            },
            // headers: {
            //     "Cross-Origin-Opener-Policy": "same-origin",
            //     "Cross-Origin-Embedder-Policy": "require-corp",
            //     "cross-origin-resource-policy": "cross-origin",
            // },
            port: 1111,
        },
    };
});
