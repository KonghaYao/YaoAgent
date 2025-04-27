import { v4 as uuidv4 } from "uuid";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { BaseStore, LangGraphRunnableConfig } from "@langchain/langgraph";

export const TodoPrompt = `你可以帮助用户管理待办事项。你可以：
1. 创建新的待办事项
2. 查看所有待办事项
3. 删除指定的待办事项
`;

interface TodoItem {
    title: string;
    description: string;
    priority: "low" | "medium" | "high";
    timestamp: string;
    completed: boolean;
}

export function createTodoTool<
    State,
    Config extends LangGraphRunnableConfig<{
        store: BaseStore;
        metadata: {
            userId: string;
        };
    }>,
>(_state: State, config?: Config) {
    if (!config || !config.store || !config.metadata?.userId) {
        console.warn("TodoTool: Config or store or userId not provided");
        return [];
    }

    const store = config.store;
    const userId = config.metadata.userId as string;

    const todoTool = tool(
        async ({ action, title, description, priority, todoId }) => {
            switch (action) {
                case "add":
                    if (!title || !description) {
                        return "添加待办事项需要提供标题和描述";
                    }
                    const newTodoId = uuidv4();
                    const timestamp = new Date().toLocaleString();
                    await store.put(["todos", userId], newTodoId, {
                        title,
                        description,
                        priority: priority || "medium",
                        timestamp,
                        completed: false,
                    });
                    return `待办事项已添加，ID: ${newTodoId}`;

                case "list":
                    const todos = await store.search(["todos", userId], {
                        limit: 10,
                        query: "",
                    });
                    if (!todos.length) {
                        return "没有待办事项";
                    }
                    const todoList = todos
                        .map((item) => {
                            const { title, description, priority, timestamp, completed } = item.value as TodoItem;
                            const status = completed ? "已完成" : "未完成";
                            return `ID: ${item.key}\n标题: ${title}\n描述: ${description}\n优先级: ${priority}\n状态: ${status}\n创建时间: ${timestamp}`;
                        })
                        .join("\n---\n");
                    return todoList;

                case "delete":
                    if (!todoId) {
                        return "请提供要删除的待办事项 ID";
                    }
                    await store.delete(["todos", userId], todoId);
                    return `待办事项 ${todoId} 已删除`;

                default:
                    return "无效的操作，请使用 add/list/delete";
            }
        },
        {
            name: "todo",
            description: "管理待办事项的工具，支持添加、查看和删除操作",
            schema: z.object({
                action: z.enum(["add", "list", "delete"]).describe("操作类型：add-添加/list-查看/delete-删除"),
                title: z.string().optional().describe("待办事项的标题（仅添加时需要）"),
                description: z.string().optional().describe("待办事项的详细描述（仅添加时需要）"),
                priority: z
                    .enum(["low", "medium", "high"])
                    .optional()
                    .describe("优先级：low/medium/high（仅添加时需要）"),
                todoId: z.string().optional().describe("要删除的待办事项 ID（仅删除时需要）"),
            }),
        }
    );

    return [todoTool];
}
