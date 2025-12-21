import { LangGraphClient, LangGraphClientConfig } from "./LangGraphClient.js";
import type { Thread } from "@langchain/langgraph-sdk";

export interface SessionInfo {
    /** 会话唯一标识，同时也是 threadId */
    sessionId: string;
    /** LangGraphClient 实例（懒加载） */
    client?: LangGraphClient;
    /** Thread 信息（懒加载，第一条消息后才创建） */
    thread?: Thread<any>;
    /** Agent 名称 */
    agentName: string;
}

export interface CreateSessionOptions {
    /** 会话 ID / Thread ID，不提供则自动生成 */
    sessionId?: string;
    /** Agent 名称 */
    agentName?: string;
    /** 是否从已有 Thread 恢复会话 */
    restore?: boolean;
    /** Graph ID */
    graphId?: string;
}

/**
 * @zh History 类用于管理多个 LangGraphClient 实例，支持多会话场景
 * @en History class manages multiple LangGraphClient instances for multi-session scenarios
 */
export class History {
    /** 存储所有会话的 Map */
    private sessions: Map<string, SessionInfo> = new Map();
    /** 当前活跃的会话 ID */
    private activeSessionId: string | null = null;
    /** 客户端配置，用于创建新的 LangGraphClient 实例 */
    private clientConfig: LangGraphClientConfig;
    /** 虚拟 Client，用于查询操作（不绑定特定 Thread） */
    private virtualClient: LangGraphClient;

    constructor(clientConfig: LangGraphClientConfig) {
        this.clientConfig = clientConfig;
        this.virtualClient = new LangGraphClient(clientConfig);
    }

    /**
     * @zh 创建新会话（延迟创建 Thread，直到发送第一条消息）
     * @en Creates a new session (lazy Thread creation until first message)
     */
    async createSession(options: CreateSessionOptions = {}): Promise<SessionInfo> {
        const sessionId = options.sessionId || this.generateSessionId();
        const agentName = options.agentName || this.virtualClient.getCurrentAssistant()?.graph_id;

        if (!agentName) {
            throw new Error("Agent name is required. Please call init() first or provide agentName.");
        }

        if (this.sessions.has(sessionId)) {
            throw new Error(`Session ${sessionId} already exists`);
        }

        const sessionInfo: SessionInfo = {
            sessionId,
            agentName,
        };

        // 如果是从已有 Thread 恢复，则立即获取 Thread
        if (options.restore) {
            sessionInfo.thread = (await this.virtualClient.threads.get(sessionId)) as Thread<any>;
        }
        // 否则 thread 为 undefined，等待第一条消息时由 Client 自动创建

        this.sessions.set(sessionId, sessionInfo);

        return sessionInfo;
    }

    /**
     * @zh 激活指定会话（懒加载创建 Client）
     * @en Activates the specified session (lazy load client)
     */
    async activateSession(sessionId: string): Promise<SessionInfo> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        // 懒加载：只在激活时创建 Client
        if (!session.client) {
            const client = new LangGraphClient(this.clientConfig);
            await client.initAssistant(session.agentName);

            // 只有在有 thread 的情况下才重置（恢复已有会话）
            // 新会话的 thread 会在发送第一条消息时自动创建
            if (session.thread) {
                await client.resetThread(session.agentName, sessionId);
            }

            session.client = client;
        }
        const lastSession = this.activeSessionId && this.sessions.get(this.activeSessionId);
        // 空闲的 client 就需要销毁
        if (lastSession && lastSession.client?.status === "idle") {
            lastSession.client?.reset();
            lastSession.client = undefined;
        }
        this.activeSessionId = sessionId;
        return session;
    }

    /**
     * @zh 获取当前活跃的会话
     * @en Gets the current active session
     */
    getActiveSession(): SessionInfo | null {
        if (!this.activeSessionId) {
            return null;
        }
        return this.sessions.get(this.activeSessionId) || null;
    }

    /**
     * @zh 获取指定会话
     * @en Gets the specified session
     */
    getSession(sessionId: string): SessionInfo | null {
        return this.sessions.get(sessionId) || null;
    }

    /**
     * @zh 获取所有会话
     * @en Gets all sessions
     */
    getAllSessions(): SessionInfo[] {
        return Array.from(this.sessions.values());
    }

    /**
     * @zh 删除指定会话
     * @en Deletes the specified session
     */
    async deleteSession(sessionId: string): Promise<boolean> {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }

        // 如果删除的是当前活跃会话，清空活跃会话
        if (this.activeSessionId === sessionId) {
            this.activeSessionId = null;
        }

        // 删除对应的远程 Thread
        try {
            await this.virtualClient.deleteThread(sessionId);
        } catch (error) {
            console.warn(`Failed to delete thread for session ${sessionId}:`, error);
        }

        this.sessions.delete(sessionId);
        return true;
    }

    /**
     * @zh 清空所有会话
     * @en Clears all sessions
     */
    async clearAllSessions(): Promise<void> {
        const sessionIds = Array.from(this.sessions.keys());
        for (const sessionId of sessionIds) {
            await this.deleteSession(sessionId);
        }
        this.activeSessionId = null;
    }

    /**
     * @zh 获取会话数量
     * @en Gets the number of sessions
     */
    getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * @zh 生成会话 ID (UUID v4 格式)
     * @en Generates a session ID (UUID v4 format)
     */
    private generateSessionId(): string {
        // 优先使用 crypto.randomUUID (Node.js 15.6+, 浏览器支持)
        if (typeof crypto !== "undefined" && crypto.randomUUID) {
            return crypto.randomUUID();
        }

        // 降级方案：生成符合 UUID v4 格式的随机 ID
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
            const r = (Math.random() * 16) | 0;
            const v = c === "x" ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
    }

    /**
     * @zh 从已有的 Thread 添加会话（仅添加元数据，不创建 Client）
     * @en Adds a session from an existing Thread (metadata only, no client created)
     */
    async addSessionFromThread(threadId: string, agentName?: string): Promise<SessionInfo> {
        const agent = agentName || this.virtualClient.getCurrentAssistant()?.graph_id;
        if (!agent) {
            throw new Error("Agent name is required. Please call init() first or provide agentName.");
        }

        return this.createSession({
            sessionId: threadId,
            agentName: agent,
            restore: true,
        });
    }

    /**
     * @zh 获取当前活跃的客户端
     * @en Gets the current active client
     */
    getActiveClient(): LangGraphClient | null {
        const session = this.getActiveSession();
        return session?.client || null;
    }

    /**
     * @zh 从远程列出所有会话
     * @en Lists all sessions from remote
     */
    async listRemoteSessions(
        options: {
            sortOrder?: "asc" | "desc";
            sortBy?: "created_at" | "updated_at";
            offset?: number;
            limit?: number;
        } = {}
    ) {
        return this.virtualClient.listThreads(options);
    }

    /**
     * @zh 从远程同步会话到本地（仅同步元数据，不创建 Client）
     * @en Syncs sessions from remote to local (metadata only, no client created)
     */
    async syncFromRemote(
        options: {
            limit?: number;
            agentName?: string;
        } = {}
    ): Promise<SessionInfo[]> {
        const agentName = options.agentName || this.virtualClient.getCurrentAssistant()?.graph_id;
        if (!agentName) {
            throw new Error("Agent name is required. Please call init() first or provide agentName.");
        }

        const threads = await this.listRemoteSessions({
            limit: options.limit || 10,
            sortBy: "updated_at",
            sortOrder: "desc",
        });

        const syncedSessions: SessionInfo[] = [];

        for (const thread of threads) {
            const threadId = thread.thread_id;

            // 更新或创建会话信息
            if (this.sessions.has(threadId)) {
                const session = this.sessions.get(threadId)!;
                session.thread = thread;
                syncedSessions.push(session);
            } else {
                const sessionInfo: SessionInfo = {
                    sessionId: threadId,
                    thread,
                    agentName,
                };
                this.sessions.set(threadId, sessionInfo);
                syncedSessions.push(sessionInfo);
            }
        }

        return syncedSessions;
    }

    /**
     * @zh 初始化 History（必须先调用）
     * @en Initializes History (must be called first)
     */
    async init(agentName?: string, config?: { fallbackToAvailableAssistants?: boolean }) {
        return this.virtualClient.initAssistant(agentName, config);
    }
}
