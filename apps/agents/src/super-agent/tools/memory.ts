import { v4 as uuidv4 } from "uuid";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { ConfigurationState } from "../state.js";

export const MemoryPrompt = `你记忆力只有七秒，所以你拥有一本 notebook, 你依靠notebook来记住重要信息。
请通过记录(notebook_write)保存重要信息，并在需要时查阅(notebook_read)以确保对话连贯性和个性化服务。
`;

export function createNoteTool<State, Config extends LangGraphRunnableConfig<typeof ConfigurationState.State>>(
    _state: State,
    config?: Config
) {
    if (!config || !config.store || !config.metadata?.userId) {
        console.warn("MemoryTool: Config or store or userId not provided");
        return [];
    }

    const store = config.store;
    const userId = config.metadata.userId as string;

    const memoryTool = tool(
        async ({ action, content, context, noteId, startTime, endTime, sortBy = "desc" }) => {
            switch (action) {
                case "write":
                    if (!content) {
                        return "写入笔记需要提供内容";
                    }
                    const memId = noteId || uuidv4();
                    const timestamp = new Date().toLocaleString();

                    await store.put(["memories", userId], memId, {
                        content,
                        context,
                        timestamp,
                    });

                    return `写入成功 ${memId}`;
                case "read":
                    const memories = await store.search(["memories", userId], {
                        limit: 5,
                        query: content || "",
                    });

                    if (!memories.length) {
                        return "No matching memories found.";
                    }

                    // 按时间过滤
                    let filteredMemories = memories;
                    if (startTime || endTime) {
                        filteredMemories = memories.filter((item) => {
                            const timestamp = new Date(item.value.timestamp).getTime();
                            const start = startTime ? new Date(startTime).getTime() : 0;
                            const end = endTime ? new Date(endTime).getTime() : Infinity;
                            return timestamp >= start && timestamp <= end;
                        });
                    }

                    // 按时间排序
                    filteredMemories.sort((a, b) => {
                        const timeA = new Date(a.value.timestamp).getTime();
                        const timeB = new Date(b.value.timestamp).getTime();
                        return sortBy === "desc" ? timeB - timeA : timeA - timeB;
                    });

                    const foundMemories = filteredMemories
                        .map((item) => {
                            const { content, context, timestamp } = item.value;
                            const time = timestamp || "未知时间";
                            return `Note ID: ${item.key}\n时间: ${time}\n内容: ${content}\n上下文: ${context}`;
                        })
                        .join("\n---\n");

                    return foundMemories || "No matching memories found.";

                case "delete":
                    if (!noteId) {
                        return "请提供要删除的笔记 ID";
                    }

                    await store.delete(["memories", userId], noteId);
                    return `笔记 ${noteId} 已删除`;

                default:
                    return "无效的操作，请使用 write/read/delete";
            }
        },
        {
            name: "notebook",
            description: "管理笔记的工具，支持写入、读取和删除操作",
            schema: z.object({
                action: z.enum(["write", "read", "delete"]).describe("操作类型：write-写入/read-读取/delete-删除"),
                content: z.string().optional().describe("笔记内容（写入时需要）或搜索查询（读取时需要）"),
                context: z.string().optional().describe("笔记的附加上下文（仅写入时需要）"),
                noteId: z.string().optional().describe("笔记 ID（删除时需要，写入时可选）"),
                startTime: z.string().optional().describe("开始时间（读取时可选，格式：YYYY-MM-DD HH:mm:ss）"),
                endTime: z.string().optional().describe("结束时间（读取时可选，格式：YYYY-MM-DD HH:mm:ss）"),
                sortBy: z
                    .enum(["asc", "desc"])
                    .optional()
                    .describe("排序方式：asc-升序/desc-降序（读取时可选，默认降序）"),
            }),
        }
    );

    return [memoryTool];
}
