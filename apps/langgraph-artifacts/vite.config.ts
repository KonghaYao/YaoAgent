import { defineConfig } from "vite";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        optimizeDeps: {
            exclude: ["@rolldown/browser"],
        },
        build: {
            target: "esnext",
        },
        server: {
            headers: {
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp",
            },
        },
    };
});
