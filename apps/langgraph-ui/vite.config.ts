import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import path from "node:path";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isHttps = mode === "https";
    return {
        plugins: [react(), isHttps ? basicSsl() : undefined],
        resolve: {
            alias: {
                "@langgraph-js/sdk": new URL("../langgraph-client/src", import.meta.url).pathname,
            },
        },
        optimizeDeps: {
            exclude: ["@langgraph-js/ui", "@langgraph-js/sdk"],
        },
        server: {
            port: 1111,
        },
    };
});
