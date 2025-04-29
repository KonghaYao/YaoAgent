import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

dotenv.config();

export default defineConfig({
    test: {
        environment: "node",
        include: ["test/**/*.test.ts"],
        coverage: {
            reporter: ["text", "json", "html"],
        },
        env: {
            TEST_PASSWORD: process.env.TEST_PASSWORD!,
        },
    },
});
