import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import tailwindcss from "@tailwindcss/vite";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const isHttps = mode === "https";
    return {
        plugins: [react(), tailwindcss(), isHttps ? basicSsl() : undefined],
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
            // headers: {
            //     "Cross-Origin-Opener-Policy": "same-origin",
            //     "Cross-Origin-Embedder-Policy": "require-corp",
            //     "cross-origin-resource-policy": "cross-origin",
            // },
            port: 1111,
        },
    };
});
