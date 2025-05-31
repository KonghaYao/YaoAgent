import { createToolUI } from "@langgraph-js/sdk";
import type { BaseDB, MemoryRecord } from "./BaseDB";

// 获取命名空间（这里简化为标识符）
function getNamespace(userId?: string): string {
    return userId || "default";
}

// 确保 JSON 可序列化
function ensureJsonSerializable(content: any): any {
    if (typeof content === "string" || typeof content === "number" || typeof content === "boolean" || content === null) {
        return content;
    }
    if (Array.isArray(content) || typeof content === "object") {
        return content;
    }
    return String(content);
}

export const createMemoryTool = (store: BaseDB<MemoryRecord>) => {
    return {
        manageMemory: createToolUI({
            name: "manage_memory",
            description: `这是一个**结构化**工具，用于**管理跨对话的持久化记忆**，以保留上下文、用户偏好和学习到的见解。它支持**创建、更新、检索和删除记忆条目**，从而在互动中保持连续性和个性化。

### 你需要记录记忆的场景

1. 请你第一时间敏锐记录下用户的细节偏好，包括对话风格、习惯、内容、方式等。
2. 记录下高价值的问答，比如用户对你的纠正、任务过程中的关键信息


### 核心功能

该工具具备以下关键能力：

* **记忆生命周期管理：** 对记忆条目进行**全生命周期管理**，包括创建、更新、检索和删除。
* **分段与标签支持：** 支持**分段或打标签的记忆条目**，方便分类和高效检索。
* **存储选项灵活：** 提供**临时和永久两种存储选项**，以适应不同类型信息的存储需求。
`,
            parameters: [
                {
                    name: "path",
                    type: "string",
                    description: "记忆路径（创建时需要）",
                },
                {
                    name: "tags",
                    type: "string[]",
                    description: "记忆标签（创建或更新时需要）",
                },
                {
                    name: "content",
                    type: "string",
                    description: "记忆内容（创建或更新时需要）",
                },
                {
                    name: "action",
                    type: "string",
                    enum: ["create", "update", "delete"],
                    description: "操作类型：create（创建）、update（更新）、delete（删除）",
                },
                {
                    name: "id",
                    type: "string",
                    description: "记忆ID（更新或删除时需要，创建时会自动生成）",
                    required: false,
                },
                {
                    name: "referencePath",
                    type: "string",
                    description: "引用文档的 URL",
                    required: false,
                },
            ],
            handler: async (args) => {
                const { content, action, id, tags, path, referencePath } = args;

                if ((action === "delete" || action === "update") && !id) {
                    throw new Error("删除或更新记忆时必须提供记忆ID");
                }

                if ((action === "create" || action === "update") && !content) {
                    throw new Error("创建或更新记忆时必须提供内容");
                }

                try {
                    if (action === "delete") {
                        await store.delete(Number(id));
                        return `已删除记忆 ${id}`;
                    }

                    const memoryData: MemoryRecord = {
                        text: content as string,
                        content: ensureJsonSerializable(content),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        namespace: getNamespace(),
                        tags: tags as string[],
                        path: path as string,
                        type: "document",
                        referencePath: referencePath as string,
                    };

                    if (action === "create") {
                        const key = await store.insert(memoryData);
                        return `已创建记忆 ${key}`;
                    } else {
                        await store.update(Number(id), memoryData);
                        return `已更新记忆 ${id}`;
                    }
                } catch (error) {
                    throw new Error(`记忆操作失败: ${error}`);
                }
            },
        }),
        searchMemory: createToolUI({
            name: "search_memory",
            description: `
搜索长期记忆中的相关信息，帮助维护对话上下文

### 何时使用此工具
1. **回答问题和提供信息：**
    当用户提出一个问题，需要你提供事实、细节或过往经验时，你的记忆系统会立即被激活。

2. **分享个人故事和经历：**
    在对话中，当话题触及你个人的过去或经历时，你会自然而然地启动记忆，将相关的事件、情感、细节提取出来，并以故事的形式分享。

3. **理解和共情对方：**
    当用户表达他们的感受、困境或观点时，为了更好地理解和共情，你会尝试从自己的记忆中寻找类似的情感体验或知识储备。

4. **提供建议和解决方案：**
    当有人寻求你的帮助或建议时，你通常会基于过去的经验和知识来提供指导。这涉及到从记忆中检索相关的策略、教训或成功案例。

5. **纠正或补充信息：**
    在对话过程中，如果对方说了一些不准确或不完整的信息，或者你觉得自己的记忆能提供更全面的视角，你会发动记忆进行纠正或补充。
`,
            parameters: [
                {
                    name: "query",
                    type: "string",
                    description: "搜索查询词或短语",
                },
                {
                    name: "tags",
                    type: "string[]",
                    description: "记忆标签",
                    required: false,
                },
                {
                    name: "path",
                    type: "string",
                    description: "记忆路径，memory://user_id/path/to/memory_name",
                    required: false,
                },
                {
                    name: "limit",
                    type: "number",
                    description: "返回结果的最大数量（默认10）",
                    required: false,
                },
            ],
            handler: async (args) => {
                const { query, limit = 10, tags, path } = args;

                if (!query || (typeof query === "string" && query.trim().length === 0)) {
                    throw new Error("搜索查询不能为空");
                }

                try {
                    const results = await store.query(query.toString(), {
                        limit: limit as number,
                    });

                    return {
                        query: query.toString(),
                        results: results,
                        total: results.length,
                        limit: Number(limit),
                    };
                } catch (error) {
                    throw new Error(`搜索记忆失败: ${error}`);
                }
            },
        }),
    };
};

export { getNamespace, ensureJsonSerializable };
