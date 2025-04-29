import { AlistAuth, AlistFS } from "../src/index.js";
import { describe, it, expect, beforeEach } from "vitest";

const TEST_PASSWORD = process.env.TEST_PASSWORD!;

describe("AlistFS", () => {
    let auth: AlistAuth;
    let fs: AlistFS;

    beforeEach(async () => {
        auth = new AlistAuth();
        await auth.login("admin", TEST_PASSWORD);
        fs = new AlistFS(auth);
    });

    it("should list files", async () => {
        const result = await fs.list("/test");
        expect(result.code).toBe(200);
        expect(result.data.content).toBeDefined();
    });

    it("should create directory", async () => {
        const result = await fs.mkdir("/test");
        expect(result.code).toBe(200);
    });

    it("should handle file operations correctly", async () => {
        // 1. 创建测试目录
        const mkdirResult = await fs.mkdir("/test/test_for_file");
        expect(mkdirResult.code).toBe(200);

        // 2. 上传测试文件
        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        const uploadResult = await fs.upload("/test/test_for_file/test.txt", file);
        expect(uploadResult.code).toBe(200);

        // 3. 重命名文件
        const renameResult = await fs.rename("/test/test_for_file/test.txt", "test_renamed.txt");
        expect(renameResult.code).toBe(200);

        // 4. 创建目标目录
        const mkdirDestResult = await fs.mkdir("/test/test_dest");
        expect(mkdirDestResult.code).toBe(200);

        // 5. 移动文件
        const moveResult = await fs.move("/test/test_for_file", "/test/test_dest", ["test_renamed.txt"]);
        expect(moveResult.code).toBe(200);

        // 6. 复制文件
        const copyResult = await fs.copy("/test/test_dest", "/test/test_for_file", ["test_renamed.txt"]);
        expect(copyResult.code).toBe(200);

        // 7. 清理测试文件
        const removeResult = await fs.remove("/test/test_dest", ["test_renamed.txt"]);
        expect(removeResult.code).toBe(200);
        const removeResult2 = await fs.remove("/test/test_for_file", ["test_renamed.txt"]);
        expect(removeResult2.code).toBe(200);

        // 8. 清理测试目录
        const removeDirResult = await fs.remove("/test", ["test_for_file"]);
        expect(removeDirResult.code).toBe(200);
        const removeDirResult2 = await fs.remove("/test", ["test_dest"]);
        expect(removeDirResult2.code).toBe(200);
    });

    it("should upload file", async () => {
        const file = new File(["test"], "test.txt", { type: "text/plain" });
        const result = await fs.upload("/test/test.txt", file);

        expect(result.code).toBe(200);

        // 清理上传的文件
        await fs.remove("/test", ["test.txt"]);
    });

    // 需要配数据库
    // it("should search files", async () => {
    //     const result = await fs.search("/test", "test", 0);
    //     expect(result.code).toBe(200);
    //     expect(result.data.content).toBeDefined();
    // });

    it("should get directory list", async () => {
        const result = await fs.dirs("/test");
        expect(result.code).toBe(200);
        expect(result.data).toBeDefined();
    });

    it("should batch rename files", async () => {
        // 1. 创建测试文件
        const file = new File(["test content"], "test1.txt", { type: "text/plain" });
        await fs.upload("/test/batch_rename/test1.txt", file);

        // 2. 批量重命名
        const result = await fs.batchRename("/test/batch_rename", [{ src_name: "test1.txt", new_name: "test2.txt" }]);
        expect(result.code).toBe(200);

        // 3. 验证重命名结果
        const listResult = await fs.list("/test/batch_rename");
        expect(listResult.data.content.some((file) => file.name === "test2.txt")).toBe(true);
    });

    it("should regex rename files", async () => {
        // 1. 创建测试文件
        const file = new File(["test content"], "test_regex1.txt", { type: "text/plain" });
        await fs.upload("/test/regex_rename/test_regex1.txt", file);

        // 2. 正则重命名
        const result = await fs.regexRename("/test/regex_rename", "test_regex(\\d+)\\.txt", "renamed_$1.txt");
        expect(result.code).toBe(200);

        // 3. 验证重命名结果
        const listResult = await fs.list("/test/regex_rename");
        expect(listResult.data.content.some((file) => file.name === "renamed_1.txt")).toBe(true);
    });

    it("should recursively move files", async () => {
        // 1. 创建源目录和文件
        await fs.mkdir("/test/src_dir");
        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        await fs.upload("/test/src_dir/test.txt", file);

        // 2. 创建目标目录
        await fs.mkdir("/test/dst_dir");

        // 3. 递归移动
        const result = await fs.recursiveMove("/test/src_dir", "/test/dst_dir");
        expect(result.code).toBe(200);
        
        // 4. 验证移动结果
        const srcList = await fs.list("/test/src_dir");
        expect(srcList.data.total).toBe(0);

        const dstList = await fs.list("/test/dst_dir");
        expect(dstList.data.content.some((file) => file.name === "test.txt")).toBe(true);
    });

    // 接口有问题
    // it("should remove empty directory", async () => {
    //     // 1. 创建空目录
    //     await fs.mkdir("/test/empty_dir");

    //     // 2. 删除空目录
    //     const result = await fs.removeEmptyDirectory("/test/empty_dir");
    //     expect(result.code).toBe(200);
        
    //     // 3. 验证删除结果
    //     const listResult = await fs.list("/test");
    //     expect(listResult.data.content.some((dir) => dir.name === "empty_dir")).toBe(false);
    // });

    it("should add offline download", async () => {
        const result = await fs.addOfflineDownload("/test/downloads", ["https://www.example.com/test.txt"], "SimpleHttp", "delete_on_upload_succeed");
        expect(result.code).toBe(200);
        expect(result.data.tasks).toBeDefined();
    });

    it("should handle file upload with task", async () => {
        const file = new File(["test content"], "test.txt", { type: "text/plain" });
        const result = await fs.upload("/test/upload", file, true);
        expect(result.code).toBe(200);
        expect(result.data.task).toBeDefined();
    });
});
