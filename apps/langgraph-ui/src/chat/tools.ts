import { createFETool } from "@langgraph-js/sdk";

// 文件操作工具
export const fileTool = createFETool({
    name: "file_operation",
    description: "执行文件操作，包括读取和写入",
    parameters: [
        {
            name: "filePath",
            type: "string",
            description: "文件的完整路径",
        },
    ],
    async handler(args) {
        return [{ type: "text", text: "执行文件操作 " + args.filePath }];
    },
});
