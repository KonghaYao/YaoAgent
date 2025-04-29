import fs from "fs/promises";
import path from "path";

export const getPrompt = async (relativePath: string) => {
    // 使用 process.cwd() 获取当前工作目录
    const fullPath = path.resolve(process.cwd(), relativePath);
    return await fs.readFile(fullPath, "utf-8");
};
