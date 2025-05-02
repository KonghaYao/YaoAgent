import { z } from "zod";
import { createTool, createFETool } from "../src/tool/createTool";

export function createTools() {
    // 文件操作工具
    const fileTool = createTool({
        name: "file_operation",
        description: "执行文件操作，包括读取和写入",
        parameters: {
            operation: z.enum(["read", "write"]).describe("操作类型：read-读取文件，write-写入文件"),
            filePath: z.string().describe("文件的完整路径"),
            content: z.string().optional().describe("写入文件时的内容，仅在 operation 为 write 时需要"),
        },
        async execute(args) {
            return [{ type: "text", text: "执行文件操作" }];
        },
    });

    // 用户交互工具
    const userInteractionTool = createFETool({
        name: "user_interaction",
        description: "与用户进行交互，包括确认和输入",
        parameters: [
            {
                name: "type",
                type: "string",
                description: "交互类型：confirm-确认，input-输入",
            },
            {
                name: "message",
                type: "string",
                description: "向用户展示的信息",
            },
            {
                name: "options",
                type: "string[]",
                description: "选项列表，仅在 type 为 confirm 时使用",
                optional: true,
            },
        ],
        handler: async (args) => {
            return {
                success: true,
                data: {
                    type: args.type,
                    message: args.message,
                    options: args.options || ["确认", "取消"],
                },
                message: "等待用户响应",
            };
        },
    });

    return [fileTool, userInteractionTool];
}
