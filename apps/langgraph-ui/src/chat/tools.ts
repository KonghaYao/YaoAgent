import { createFETool, ToolManager } from "@langgraph-js/sdk";

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
    returnDirect: true,
    callbackMessage: () => [{ type: "ai", content: "工作完成" }],
    async handler(args) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
        return [{ type: "text", text: "执行文件操作 " + args.filePath }];
    },
});

export const askUserTool = createFETool({
    name: "ask_user",
    description: "询问用户",
    parameters: [
        {
            name: "question",
            type: "string",
            description: "问题",
        },
    ],
    handler: ToolManager.waitForUIDone,
});
