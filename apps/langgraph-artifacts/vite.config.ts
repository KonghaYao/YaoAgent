import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        optimizeDeps: {
            exclude: ["@rolldown/browser"],
        },
        base: "./",
        build: {
            target: "esnext",
        },
        server: {
            headers: {
                "Cross-Origin-Opener-Policy": "same-origin",
                "Cross-Origin-Embedder-Policy": "require-corp",
            },
        },
        plugins: [react()],
    };
});
