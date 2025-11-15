import { defineConfig } from "vite";
import { nodeExternals } from "rollup-plugin-node-externals";
// nodejs 环境，不要 browser 环境
export default defineConfig({
    resolve: {
        alias: {
            turndown: "./node_modules/turndown/lib/turndown.es.js",
            "@mixmark-io/domino": "./node_modules/@mixmark-io/domino/lib/index.js",
        },
    },
    plugins: [
        nodeExternals(),
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
            entry: {
                index: "src/index.ts",
                hono: "src/endpoint/hono.ts",
                mcp: "src/endpoint/mcp.ts",
            },
            formats: ["es"],
        },
        assetsInlineLimit: 0,
        minify: false,
    },
});
