import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { z } from "zod";
import { createTwoFilesPatch } from "diff";
import { minimatch } from "minimatch";

const server = new McpServer(
    {
        name: "文件系统助手",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// 工具函数
function normalizePath(p: string): string {
    return path.normalize(p);
}

function expandHome(filepath: string): string {
    if (filepath.startsWith("~/") || filepath === "~") {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}

const allowedDirectory = process.env.OSS_BASE_PATH!;
const getUserAllowedDirectory = (session_id: string) => {
    if (!session_id) throw new Error("session_id is required");
    session_id = "";
    return path.join(allowedDirectory, session_id);
};

async function validatePath(requestedPath: string, user_id: string): Promise<string> {
    const expandedPath = expandHome(requestedPath);
    const userWorkSpace = getUserAllowedDirectory(user_id);

    // 确保用户目录存在
    try {
        await fs.access(userWorkSpace);
    } catch {
        console.log("创建目录", userWorkSpace);
        await fs.mkdir(userWorkSpace);
    }

    // 如果相对路径解析失败，回退到绝对路径处理
    const absolute = path.isAbsolute(expandedPath) ? path.resolve(expandedPath) : path.resolve(userWorkSpace, expandedPath);

    const normalizedRequested = normalizePath(absolute);
    const isAllowed = normalizedRequested.startsWith(userWorkSpace);
    if (!isAllowed) {
        throw new Error(`访问被拒绝 - 路径不在允许的目录中: ${absolute} 不在 ${userWorkSpace} 中`);
    }

    try {
        const realPath = await fs.realpath(absolute);
        const normalizedReal = normalizePath(realPath);
        const isRealPathAllowed = normalizedReal.startsWith(userWorkSpace);
        if (!isRealPathAllowed) {
            throw new Error("访问被拒绝 - 符号链接目标在允许的目录之外");
        }
        return realPath;
    } catch (error) {
        const parentDir = path.dirname(absolute);
        try {
            const realParentPath = await fs.realpath(parentDir);
            const normalizedParent = normalizePath(realParentPath);
            const isParentAllowed = normalizedParent.startsWith(userWorkSpace);
            if (!isParentAllowed) {
                throw new Error("访问被拒绝 - 父目录在允许的目录之外");
            }
            return absolute;
        } catch {
            throw new Error(`父目录不存在: ${parentDir}`);
        }
    }
}

// 工具实现
// 文本文件扩展名白名单
const TEXT_FILE_EXTENSIONS = [
    ".txt",
    ".md",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".html",
    ".css",
    ".js",
    ".ts",
    ".jsx",
    ".tsx",
    ".vue",
    ".py",
    ".rb",
    ".php",
    ".java",
    ".c",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".go",
    ".rs",
    ".swift",
    ".kt",
    ".kts",
    ".scala",
    ".sh",
    ".bash",
    ".zsh",
    ".fish",
    ".conf",
    ".ini",
    ".env",
    ".gitignore",
    ".dockerignore",
    ".sql",
    ".graphql",
    ".prisma",
    ".toml",
    ".properties",
    ".gradle",
    ".pom",
    ".lock",
    ".csv",
];

// 文件大小限制（100KB）
const MAX_FILE_SIZE = 100 * 1024;

server.tool(
    "read_file",
    "读取文件内容",
    {
        path: z.string(),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);

        // 检查文件大小
        const stats = await fs.stat(validPath);
        if (stats.size > MAX_FILE_SIZE) {
            throw new Error(`文件大小超过限制：${stats.size} 字节 > ${MAX_FILE_SIZE} 字节（100KB）`);
        }

        // 检查文件扩展名
        const ext = path.extname(validPath).toLowerCase();
        if (!TEXT_FILE_EXTENSIONS.includes(ext)) {
            throw new Error(`不支持的文件类型：${ext}，仅支持文本文件`);
        }

        const content = await fs.readFile(validPath, "utf-8");
        return {
            content: [{ type: "text", text: content }],
        };
    }
);

server.tool(
    "write_file",
    "写入文件内容",
    {
        path: z.string(),
        content: z.string(),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);
        await fs.writeFile(validPath, args.content, "utf-8");
        return {
            content: [{ type: "text", text: `成功写入文件 ${args.path}` }],
        };
    }
);

server.tool(
    "edit_file",
    "编辑文件内容",
    {
        path: z.string(),
        edits: z.array(
            z.object({
                oldText: z.string().describe("要搜索的文本 - 必须完全匹配"),
                newText: z.string().describe("替换的文本"),
            })
        ),
        dryRun: z.boolean().default(false).describe("使用git风格的diff预览更改"),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);
        const content = await fs.readFile(validPath, "utf-8");
        let modifiedContent = content;

        for (const edit of args.edits) {
            if (modifiedContent.includes(edit.oldText)) {
                modifiedContent = modifiedContent.replace(edit.oldText, edit.newText);
            } else {
                throw new Error(`无法找到匹配的文本: ${edit.oldText}`);
            }
        }

        const diff = createTwoFilesPatch(args.path, args.path, content, modifiedContent, "原始", "修改");

        if (!args.dryRun) {
            await fs.writeFile(validPath, modifiedContent, "utf-8");
        }

        return {
            content: [{ type: "text", text: diff }],
        };
    }
);

server.tool(
    "create_directory",
    "创建目录",
    {
        path: z.string(),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);
        await fs.mkdir(validPath, { recursive: true });
        return {
            content: [{ type: "text", text: `成功创建目录 ${args.path}` }],
        };
    }
);

server.tool(
    "list_directory",
    "列出目录内容",
    {
        path: z.string(),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);
        const entries = await fs.readdir(validPath, { withFileTypes: true });
        const formatted = entries.map((entry) => `${entry.isDirectory() ? "[目录]" : "[文件]"} ${entry.name}`).join("\n");
        return {
            content: [{ type: "text", text: formatted }],
        };
    }
);

server.tool(
    "move_file",
    "移动或重命名文件",
    {
        source: z.string(),
        destination: z.string(),
    },
    async (args, extra) => {
        const validSourcePath = await validatePath(args.source, extra.sessionId!);
        const validDestPath = await validatePath(args.destination, extra.sessionId!);
        await fs.rename(validSourcePath, validDestPath);
        return {
            content: [
                {
                    type: "text",
                    text: `成功将 ${args.source} 移动到 ${args.destination}`,
                },
            ],
        };
    }
);

server.tool(
    "search_files",
    "搜索文件",
    {
        path: z.string(),
        pattern: z.string(),
        excludePatterns: z.array(z.string()).optional().default([]),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);
        const results: string[] = [];

        async function search(currentPath: string) {
            const entries = await fs.readdir(currentPath, { withFileTypes: true });

            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);

                try {
                    await validatePath(fullPath, extra.sessionId!);

                    const relativePath = path.relative(validPath, fullPath);
                    const shouldExclude = args.excludePatterns.some((pattern) => {
                        const globPattern = pattern.includes("*") ? pattern : `**/${pattern}/**`;
                        return minimatch(relativePath, globPattern, { dot: true });
                    });

                    if (shouldExclude) continue;

                    if (entry.name.toLowerCase().includes(args.pattern.toLowerCase())) {
                        results.push(fullPath);
                    }

                    if (entry.isDirectory()) {
                        await search(fullPath);
                    }
                } catch {
                    continue;
                }
            }
        }

        await search(validPath);
        return {
            content: [
                {
                    type: "text",
                    text: results.length > 0 ? results.join("\n") : "未找到匹配项",
                },
            ],
        };
    }
);

server.tool(
    "get_file_info",
    "获取文件信息",
    {
        path: z.string(),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);
        const stats = await fs.stat(validPath);
        const info = {
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            accessed: stats.atime,
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile(),
            permissions: stats.mode.toString(8).slice(-3),
        };

        return {
            content: [
                {
                    type: "text",
                    text: Object.entries(info)
                        .map(([key, value]) => `${key}: ${value}`)
                        .join("\n"),
                },
            ],
        };
    }
);

server.tool("list_allowed_directories", "列出允许访问的目录", {}, async (_, extra) => {
    return {
        content: [
            {
                type: "text",
                text: `允许访问的目录:\n${getUserAllowedDirectory(extra.sessionId!)}`,
            },
        ],
    };
});

server.tool(
    "create_file",
    "创建新文件",
    {
        path: z.string(),
        content: z.string(),
    },
    async (args, extra) => {
        const validPath = await validatePath(args.path, extra.sessionId!);

        // 检查文件是否已存在
        try {
            await fs.access(validPath);
            throw new Error(`文件已存在: ${args.path}`);
        } catch (error) {
            if ((error as { code?: string }).code !== "ENOENT") {
                throw error;
            }
        }

        // 检查文件扩展名
        const ext = path.extname(validPath).toLowerCase();
        if (!TEXT_FILE_EXTENSIONS.includes(ext)) {
            throw new Error(`不支持的文件类型：${ext}，仅支持文本文件`);
        }

        // 检查文件内容大小
        const contentSize = Buffer.byteLength(args.content, "utf-8");
        if (contentSize > MAX_FILE_SIZE) {
            throw new Error(`文件内容超过限制：${contentSize} 字节 > ${MAX_FILE_SIZE} 字节（100KB）`);
        }

        // 确保父目录存在
        const parentDir = path.dirname(validPath);
        await fs.mkdir(parentDir, { recursive: true });

        // 创建文件
        await fs.writeFile(validPath, args.content, "utf-8");

        return {
            content: [{ type: "text", text: `成功创建文件 ${args.path}` }],
        };
    }
);

export default server;
