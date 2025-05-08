#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname } from "path";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 设置工作目录为脚本所在目录
process.chdir(__dirname);

// 获取传递给脚本的参数（跳过前两个参数，即 node 和脚本名称）
const args = process.argv.slice(2);

console.log("启动 LangGraph UI...");
console.log(`命令: vite preview ${args.join(" ")}`);

// 使用 spawn 而不是 exec，以便更好地处理输入/输出流和参数
const childProcess = spawn("npx", ["vite", "preview", ...args], {
    stdio: "inherit", // 继承父进程的 stdio，使输出直接显示在控制台
    shell: true,
});

// 处理子进程退出
childProcess.on("close", (code) => {
    console.log(`LangGraph UI 已退出，退出码: ${code}`);
});

// 处理退出信号
process.on("SIGINT", () => {
    console.log("正在停止 LangGraph UI...");
    childProcess.kill("SIGINT");
    // 不立即退出主进程，让子进程有机会清理
});
