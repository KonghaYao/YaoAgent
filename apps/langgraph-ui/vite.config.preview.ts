import { defineConfig, Plugin } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { OpenSmithPlugin } from "./src/OpenSmithPlugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isHttps = mode === "https";
    return {
        plugins: [isHttps ? basicSsl() : undefined, OpenSmithPlugin()],
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
