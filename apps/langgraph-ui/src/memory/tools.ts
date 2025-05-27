import { createToolUI } from "@langgraph-js/sdk";
import { VecDB, TextVectorizer } from "./db";
import type { Vector, VectorRecord } from "./db";

interface MemoryStore {
    insert(data: VectorRecord): Promise<number>;
    update(key: number, data: VectorRecord): Promise<void>;
    delete(key: number): Promise<void>;
    query(queryText: string, options?: { limit?: number }): Promise<Array<VectorRecord & { similarity: number }>>;
}

class VecDBStore implements MemoryStore {
    private db: VecDB;

    constructor(vectorizer: TextVectorizer) {
        this.db = new VecDB({
            vectorPath: "db_name",
            vectorizer,
        });
    }

    async insert(data: VectorRecord): Promise<number> {
        return await this.db.insert(data);
    }

    async update(key: number, data: VectorRecord): Promise<void> {
        return await this.db.update(key, data);
    }

    async delete(key: number): Promise<void> {
        return await this.db.delete(key);
    }

    async query(queryText: string, options: { limit?: number } = {}): Promise<Array<VectorRecord & { similarity: number }>> {
        return await this.db.query(queryText, options);
    }

    // 简单的文本搜索方法
    async searchByText(query: string, limit: number = 10): Promise<VectorRecord[]> {
        // 使用向量搜索作为文本搜索的替代
        const results = await this.query(query, { limit });
        return results.map(({ similarity, ...record }) => record);
    }
}

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

export const createMemoryTool = (vectorizer: TextVectorizer) => {
    const store = new VecDBStore(vectorizer);

    return {
        manageMemory: createToolUI({
            name: "manage_memory",
            description: "创建、更新或删除持久化记忆，用于在对话间保持上下文和用户偏好",
            parameters: [
                {
                    name: "content",
                    type: "string",
                    description: "记忆内容（创建或更新时需要）",
                    optional: true,
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
                    optional: true,
                },
            ],
            handler: async (args) => {
                const { content, action, id } = args;

                // // 参数验证
                // if (action === "create" && id) {
                //     throw new Error("创建记忆时不能提供ID，系统会自动生成");
                // }

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

                    const memoryData: VectorRecord = {
                        text: content!,
                        content: ensureJsonSerializable(content),
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        namespace: getNamespace(),
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
            description: "搜索长期记忆中的相关信息，帮助维护对话上下文",
            parameters: [
                {
                    name: "query",
                    type: "string",
                    description: "搜索查询词或短语",
                },
                {
                    name: "limit",
                    type: "number",
                    description: "返回结果的最大数量（默认10）",
                    optional: true,
                },
            ],
            handler: async (args: { [key: string]: string | number }) => {
                const { query, limit = 10 } = args;

                if (!query || (typeof query === "string" && query.trim().length === 0)) {
                    throw new Error("搜索查询不能为空");
                }

                try {
                    const results = await store.query(query.toString(), { limit: Number(limit) });

                    return {
                        query: query.toString(),
                        results: results.map((result) => ({
                            id: result.id,
                            content: result.content || result.text,
                            similarity: result.similarity,
                            createdAt: result.createdAt,
                            updatedAt: result.updatedAt,
                        })),
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

export type { Vector, VectorRecord, MemoryStore };

export { VecDBStore, getNamespace, ensureJsonSerializable };
