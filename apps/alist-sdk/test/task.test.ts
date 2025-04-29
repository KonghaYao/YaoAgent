import { AlistAuth, AlistTask } from "../src/index.js";
import { describe, it, expect, beforeEach } from "vitest";

const TEST_PASSWORD = process.env.TEST_PASSWORD!;

describe("AlistTask", () => {
    let auth: AlistAuth;
    let task: AlistTask;

    beforeEach(async () => {
        auth = new AlistAuth();
        await auth.login("admin", TEST_PASSWORD);
        task = new AlistTask(auth);
    });

    it("should list tasks", async () => {
        const result = await task.list();
        expect(result.code).toBe(200);
        expect(result.data.tasks).toBeDefined();
    });

    it("should cancel task", async () => {
        const result = await task.cancel("task_id");
        expect(result.code).toBe(200);
    });

    it("should delete task", async () => {
        const result = await task.delete("task_id");
        expect(result.code).toBe(200);
    });

    it("should clear tasks", async () => {
        const result = await task.clear();
        expect(result.code).toBe(200);
    });

    it("should retry task", async () => {
        const result = await task.retry("task_id");
        expect(result.code).toBe(200);
    });
});
