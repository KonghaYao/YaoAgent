import { defineConfig } from "vite";

// nodejs 环境，不要 browser 环境
export default defineConfig({
    resolve: {
        alias: {
            turndown: "./node_modules/turndown/lib/turndown.es.js",
        },
    },
    mode: "production",
    build: {
        target: "esnext",
        lib: {
            entry: "src/index.ts",
            formats: ["es"],
            fileName: "index",
        },
        minify: false,
    },
});
