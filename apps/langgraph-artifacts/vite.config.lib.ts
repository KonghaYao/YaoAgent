import { defineConfig } from "vite";
import fs from "node:fs";
import react from "@vitejs/plugin-react";
const cdns = fs.readdirSync("./lib").map((i) => "./lib/" + i);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    return {
        jsx: "react",
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
        plugins: [react()],
    };
});
