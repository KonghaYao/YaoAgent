import { defineConfig } from "vite";
import fs from "node:fs";
const cdns = fs.readdirSync("./lib").map((i) => "./lib/" + i);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        base: "./",
        build: {
            lib: {
                entry: cdns,
                formats: ["es"],
                minify: false,
            },
            target: "esnext",
            outDir: "dist/cdn",
        },
    };
});
