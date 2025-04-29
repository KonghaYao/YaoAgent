import { AlistAuth, AlistPublic } from "../src/index.js";
import { describe, it, expect, beforeEach } from "vitest";

const TEST_PASSWORD = process.env.TEST_PASSWORD!;

describe("AlistPublic", () => {
    let auth: AlistAuth;
    let publicApi: AlistPublic;

    beforeEach(async () => {
        auth = new AlistAuth();
        await auth.login("admin", TEST_PASSWORD);
        publicApi = new AlistPublic(auth);
    });

    it("should list public files", async () => {
        const result = await publicApi.list("/public");
        expect(result.code).toBe(200);
        expect(result.data.content).toBeDefined();
    });

    it("should get public file info", async () => {
        const result = await publicApi.get("/public/test.txt");
        expect(result.code).toBe(200);
        expect(result.data.name).toBeDefined();
    });
});
