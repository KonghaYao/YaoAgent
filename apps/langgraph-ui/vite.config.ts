import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    optimizeDeps: {
        exclude: ["@langgraph-js/ui", "@langgraph-js/sdk"],
    },
    server: {
        port: 1111,
    },
});
