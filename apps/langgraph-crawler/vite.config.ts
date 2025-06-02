import { defineConfig } from "vite";

// nodejs 环境，不要 browser 环境
export default defineConfig({
    resolve: {
        alias: {
            turndown: "./node_modules/turndown/lib/turndown.es.js",
            "@mixmark-io/domino": "./node_modules/@mixmark-io/domino/lib/index.js",
        },
    },
    plugins: [
        {
            name: "turndown",
            enforce: "pre",
            transform(code, id) {
                if (id.includes("turndown")) {
                    const originCode = code.replace("var domino = require('@mixmark-io/domino');", "");
                    return `import domino from '@mixmark-io/domino';\n` + originCode;
                }
            },
        },
    ],
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
