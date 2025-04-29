import { AlistAuth } from "../src/index.js";
import { describe, it, expect, beforeEach } from "vitest";
import { createHash } from "crypto";

const TEST_PASSWORD = process.env.TEST_PASSWORD!;

function hashPassword(password: string): string {
    const passwordWithSuffix = `${password}-https://github.com/alist-org/alist`;
    return createHash("sha256").update(passwordWithSuffix).digest("hex");
}

describe("AlistAuth", () => {
    let auth: AlistAuth;

    beforeEach(() => {
        auth = new AlistAuth();
    });

    it("should login successfully", async () => {
        const result = await auth.login("admin", TEST_PASSWORD);
        expect(result.code).toBe(200);
        expect(result.data.token).toBeDefined();
    });

    it("should login with hash successfully", async () => {
        const hashedPassword = hashPassword(TEST_PASSWORD);
        const result = await auth.loginWithHash("admin", hashedPassword);
        expect(result.code).toBe(200);
        expect(result.data.token).toBeDefined();
    });

    it("should get user info after login", async () => {
        await auth.login("admin", TEST_PASSWORD);
        const result = await auth.getUserInfo();
        expect(result.code).toBe(200);
        expect(result.data.username).toBe("admin");
    });

    // it("should generate 2FA", async () => {
    //     await auth.login("admin", TEST_PASSWORD);
    //     const result = await auth.generate2FA();
    //     expect(result.code).toBe(200);
    //     expect(result.data.secret).toBeDefined();
    //     expect(result.data.qrcode).toBeDefined();
    // });

    // it("should verify 2FA", async () => {
    //     await auth.login("admin", TEST_PASSWORD);
    //     const result = await auth.verify2FA("123456", "secret");
    //     expect(result.code).toBe(200);
    // });

    // it("should get temporary JWT token", async () => {
    //     const hashedPassword = hashPassword(TEST_PASSWORD);
    //     const result = await auth.loginWithHash("admin", hashedPassword);
    //     expect(result.code).toBe(200);
    //     expect(result.data.token).toBeDefined();
        
    //     // 验证 token 是否有效
    //     const userInfo = await auth.getUserInfo();
    //     expect(userInfo.code).toBe(200);
    //     expect(userInfo.data.username).toBe("admin");
    // });
});
