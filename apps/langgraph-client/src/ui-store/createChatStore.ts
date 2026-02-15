import { atom } from "nanostores";
import { LangGraphClient, LangGraphClientConfig, RenderMessage, SendMessageOptions } from "../LangGraphClient.js";
import { AssistantGraph, Message, Thread } from "@langchain/langgraph-sdk";
import { debounce } from "ts-debounce";
import { ToolRenderData } from "../tool/ToolUI.js";
import { UnionTool } from "../tool/createTool.js";
import { createLangGraphServerClient } from "../client/LanggraphServer.js";
import { useArtifacts } from "../artifacts/index.js";
import { RevertChatToOptions } from "../time-travel/index.js";
import { History, SessionInfo } from "../History.js";
import { InterruptData, InterruptResponse } from "../humanInTheLoop.js";

// ============ 工具函数 ============

export const formatTime = (date: Date) => date.toLocaleTimeString();
export const formatFullTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const mi = pad(date.getMinutes());
    const ss = pad(date.getSeconds());
    return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
};
export const formatTokens = (tokens: number) => tokens.toLocaleString("en");

export const getMessageContent = (content: any) => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (typeof item === "string") return item;
                if (item.type === "text") return item.text;
                if (item.type === "image_url") return `[图片]`;
                if (item.type === "tool_use") return "";
                return JSON.stringify(item);
            })
            .join("");
    }
    return JSON.stringify(content);
};

export const getHistoryContent = (thread: Thread) => {
    /** @ts-ignore */
    const content: string | any[] = thread.title || thread.name || (thread?.values as any)?.messages?.[0]?.content;
    if (content && Array.isArray(content)) {
        return content.map((item: any) => (item.type === "text" ? item.text : undefined)).filter(Boolean);
    }
    return typeof content === "string" ? content : "";
};

// ============ 类型定义 ============

interface ChatStoreContext {
    showHistory?: boolean;
    showGraph?: boolean;
    fallbackToAvailableAssistants?: boolean;
    onInit?: (client: LangGraphClient) => void;
    /** 初始化时是否自动激活最近的历史会话（默认 false，创建新会话） */
    autoRestoreLastSession?: boolean;
}

// 分页状态类型
export interface HistoryPagination {
    page: number;
    pageSize: number;
    total: number;
}

// 历史记录筛选类型
export interface HistoryFilter {
    metadata: Record<string, any> | null;
    status: "idle" | "busy" | "interrupted" | "error" | null;
    sortBy: "thread_id" | "status" | "created_at" | "updated_at";
    sortOrder: "asc" | "desc";
}

// ============ Store 创建函数 ============

export const createChatStore = (initClientName: string, config: Partial<LangGraphClientConfig>, context: ChatStoreContext = {}) => {
    // ============ 状态原子 ============

    // 会话管理
    const history = atom<History | null>(null);
    const sessions = atom<SessionInfo[]>([]);
    const client = atom<LangGraphClient | null>(null);
    const historyList = atom<Thread<{ messages: Message[] }>[]>([]);

    // UI 状态
    const renderMessages = atom<RenderMessage[]>([]);
    const userInput = atom<string>("");
    const inChatError = atom<string | null>(null);
    const currentAgent = atom<string>(initClientName);
    const currentChatId = atom<string | null>(null);
    const currentNodeName = atom<string>("__start__");
    const currentStatus = atom<string>("idle");
    // Interrupt 状态
    const interruptData = atom<InterruptData | null>(null);
    const isInterrupted = atom<boolean>(false);

    // 工具和图表
    const tools = atom<UnionTool<any>[]>([]);
    const collapsedTools = atom<string[]>([]);
    const showHistory = atom<boolean>(context.showHistory ?? false);
    const showGraph = atom<boolean>(context.showGraph ?? false);
    const graphVisualize = atom<AssistantGraph | null>(null);

    // 分页状态
    const historyPagination = atom<HistoryPagination>({
        page: 1,
        pageSize: 10,
        total: 0,
    });

    // 历史记录筛选状态
    const historyFilter = atom<HistoryFilter>({
        metadata: null,
        status: null,
        sortBy: "updated_at",
        sortOrder: "desc",
    });

    // ============ 内部状态 ============

    let cleanupCurrentClient: (() => void) | null = null;

    // ============ 计算属性 ============

    /** 基于 client.status 的 loading 状态 */
    const loading = atom<boolean>(false);

    const updateLoadingFromClientStatus = () => {
        const c = client.get();
        if (c) {
            // interrupted 状态也应该被视为 loading，因为用户需要处理中断
            loading.set(c.status === "busy" || c.status === "interrupted");
        }
    };

    // ============ UI 更新逻辑 ============

    const updateUI = debounce((newClient: LangGraphClient) => {
        if (client.get() !== newClient) return;

        const messages = newClient.renderMessage;
        const lastMessage = messages[messages.length - 1];

        currentNodeName.set(lastMessage?.node_name || lastMessage?.name || "__start__");
        renderMessages.set(messages);
        currentStatus.set(newClient.status);
    }, 10);
    // ============ 工具和图表辅助函数 ============

    const refreshTools = async () => {
        const c = client.get();
        if (!c) return;
        c.tools.clearTools();
        c.tools.bindTools(tools.get());
    };

    const refreshGraph = async () => {
        if (showGraph.get()) {
            graphVisualize.set((await client.get()?.graphVisualize()) || null);
        }
    };

    // ============ 会话管理核心逻辑 ============

    async function initClient() {
        const historyManager = new History({
            ...config,
            client: config.client ?? (await createLangGraphServerClient(config as LangGraphClientConfig)),
        });
        await historyManager.init(currentAgent.get(), { fallbackToAvailableAssistants: context.fallbackToAvailableAssistants });
        history.set(historyManager);

        // 根据配置决定初始化行为
        if (context.autoRestoreLastSession) {
            await refreshSessionList();
            if (sessions.get().length > 0) {
                const syncedSessions = sessions.get();
                // 自动激活最近的历史会话
                await activateSession(syncedSessions[0].sessionId);
            } else {
                await createNewSession();
            }
        } else {
            // 创建新会话
            await createNewSession();
        }

        return historyManager;
    }

    async function refreshSessionList() {
        const historyManager = history.get();
        if (!historyManager) return;

        try {
            const pagination = historyPagination.get();
            const filter = historyFilter.get();

            // 计算偏移量
            const offset = (pagination.page - 1) * pagination.pageSize;

            // 使用 listRemoteSessions 支持筛选
            const threads = await historyManager.listRemoteSessions({
                limit: pagination.pageSize,
                offset,
                metadata: filter.metadata || undefined,
                status: filter.status || undefined,
                sortBy: filter.sortBy,
                sortOrder: filter.sortOrder,
                withoutDetails: true,
            });

            // 注意：后端可能不返回总数，这里需要根据返回的记录数判断是否有下一页
            // 如果返回的记录数小于 pageSize，说明没有更多数据了
            const hasMore = threads.length === pagination.pageSize;
            const estimatedTotal = (pagination.page - 1) * pagination.pageSize + threads.length;

            sessions.set(
                threads.map(
                    (thread) =>
                        ({
                            sessionId: thread.thread_id,
                            thread,
                            agentName: currentAgent.get(),
                        }) as SessionInfo
                )
            );

            historyList.set(threads as Thread<{ messages: Message[] }>[]);

            // 更新分页状态（注意：这里只是估计值，实际总数可能需要从后端获取）
            historyPagination.set({
                ...pagination,
                total: hasMore ? pagination.page * pagination.pageSize + 1 : estimatedTotal,
            });
        } catch (error) {
            console.error("Failed to sync sessions:", error);
        }
    }

    async function createNewSession() {
        const historyManager = history.get();
        if (!historyManager) return;

        try {
            const session = await historyManager.createSession();
            await refreshSessionList();
            await activateSession(session.sessionId);
        } catch (error) {
            console.error("Failed to create new session:", error);
            inChatError.set((error as Error).message);
        }
    }

    // ============ 客户端事件监听器 ============

    function setupClientListeners(newClient: LangGraphClient) {
        const isActiveClient = () => client.get() === newClient;

        const onStart = () => {
            if (isActiveClient()) updateLoadingFromClientStatus();
        };

        const onThread = () => {
            if (!isActiveClient()) return;

            const thread = newClient.getCurrentThread();
            currentChatId.set(thread?.thread_id || null);
            currentNodeName.set("__start__");

            const historyManager = history.get();
            const activeSession = historyManager?.getActiveSession();
            if (activeSession && thread) {
                activeSession.thread = thread;
            }

            refreshSessionList();
        };

        const onDone = () => {
            if (isActiveClient()) {
                updateLoadingFromClientStatus();
                updateUI(newClient);
            }
        };

        const onError = (event: any) => {
            if (isActiveClient()) {
                updateLoadingFromClientStatus();
                inChatError.set(event.data);
            }
        };

        const onMessage = () => {
            if (isActiveClient()) {
                currentChatId.set(newClient.getCurrentThread()?.thread_id || null);
                updateLoadingFromClientStatus();
                updateUI(newClient);
            }
        };

        const onValue = () => {
            if (isActiveClient()) {
                currentChatId.set(newClient.getCurrentThread()?.thread_id || null);
                updateLoadingFromClientStatus();
                updateUI(newClient);
            }
        };

        const onInterrupted = (event: any) => {
            if (!isActiveClient()) return;

            const interruptInfo = newClient.interruptData;
            if (interruptInfo) {
                interruptData.set(interruptInfo);
                isInterrupted.set(true);
                updateLoadingFromClientStatus();
            } else {
                interruptData.set(null);
                isInterrupted.set(false);
            }
            updateUI(newClient);
            client.set(client.get());
        };

        newClient.on("start", onStart);
        newClient.on("thread", onThread);
        newClient.on("done", onDone);
        newClient.on("error", onError);
        newClient.on("message", onMessage);
        newClient.on("value", onValue);
        newClient.on("interruptChange", onInterrupted);

        return () => {
            newClient.off("start", onStart);
            newClient.off("thread", onThread);
            newClient.off("done", onDone);
            newClient.off("error", onError);
            newClient.off("message", onMessage);
            newClient.off("value", onValue);
            newClient.off("interruptChange", onInterrupted);
        };
    }

    // ============ 会话激活逻辑 ============

    async function activateSession(sessionId: string, mustResetStream = false) {
        const historyManager = history.get();
        if (!historyManager) return;

        try {
            if (cleanupCurrentClient) {
                cleanupCurrentClient();
                cleanupCurrentClient = null;
            }

            inChatError.set(null);
            interruptData.set(null);
            isInterrupted.set(false);

            const session = await historyManager.activateSession(sessionId, mustResetStream);
            const activeClient = session.client;

            if (activeClient) {
                cleanupCurrentClient = setupClientListeners(activeClient);
                context.onInit?.(activeClient);
                client.set(activeClient);
                currentChatId.set(sessionId);

                const messages = activeClient.renderMessage;
                renderMessages.set(messages);

                const lastMessage = messages[messages.length - 1];
                currentNodeName.set(lastMessage?.node_name || lastMessage?.name || "__start__");

                updateLoadingFromClientStatus();

                if (showGraph.get()) refreshGraph();
                refreshTools();

                const currentThread = activeClient.getCurrentThread() as any;
                if (currentThread && (currentThread.status === "busy" || currentThread.status === "pending")) {
                    await activeClient.resetStream();
                }

                // 检查是否处于中断状态
                if (currentThread?.status === "interrupted") {
                    const interruptInfo = activeClient.interruptData;
                    if (interruptInfo) {
                        interruptData.set(interruptInfo);
                        isInterrupted.set(true);
                    }
                }
            }
        } catch (error) {
            console.error("Failed to activate session:", error);
            inChatError.set((error as Error).message);
        }
    }

    // ============ 消息和交互逻辑 ============

    async function sendMessage(message?: Message[], extraData?: SendMessageOptions, withoutCheck = false, isResume = false) {
        const c = client.get();
        if ((!withoutCheck && !userInput.get().trim() && !message?.length) || !c) return;

        // 使用 client.status 判断是否正在加载
        if (c.status === "busy") return;

        inChatError.set(null);
        try {
            loading.set(true);
            await c.sendMessage(message || userInput.get(), extraData);
        } catch (e) {
            const isThreadRunning = (e as Error).message.includes("422");
            if (isThreadRunning) {
                await c.resetStream();
            } else {
                throw e;
            }
        } finally {
            userInput.set("");
            updateLoadingFromClientStatus();
        }
    }

    function stopGeneration() {
        client.get()?.cancelRun();
    }

    function toggleToolCollapse(toolId: string) {
        const prev = collapsedTools.get();
        collapsedTools.set(prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]);
    }

    function toggleHistoryVisible() {
        showHistory.set(!showHistory.get());
        if (showHistory.get()) {
            refreshSessionList();
        }
    }

    function addToHistory(thread: Thread<{ messages: Message[] }>) {
        const prev = historyList.get();
        historyList.set([thread, ...prev]);
    }

    function getToolUIRender(tool_name: string) {
        const c = client.get();
        if (!c) return null;
        const toolRender = c.tools.getTool(tool_name)?.render;
        return toolRender ? (message: RenderMessage) => toolRender(new ToolRenderData(message, c)) : null;
    }

    // ============ 返回 Store API ============

    const artifactHook = useArtifacts(renderMessages, client);

    return {
        data: {
            // 核心客户端
            client,
            history,
            sessions,

            // UI 状态
            renderMessages,
            userInput,
            loading,
            inChatError,
            currentAgent,
            currentChatId,
            currentNodeName,
            currentStatus,

            // Interrupt 状态
            interruptData,
            isInterrupted,

            // 工具和图表
            tools,
            collapsedTools,
            showGraph,
            graphVisualize,

            // 历史记录
            showHistory,
            historyList,

            // 分页和筛选
            historyPagination,
            historyFilter,

            ...artifactHook.data,
        },
        mutations: {
            // 初始化
            initClient,
            getClient: () => client.get(),
            getHistory: () => history.get(),

            // 会话管理
            activateSession,
            createNewSession,
            refreshSessionList,
            refreshHistoryList: refreshSessionList, // 向后兼容

            // 消息操作
            sendMessage,
            stopGeneration,
            setUserInput: (input: string) => userInput.set(input),
            async revertChatTo(messageId: string, resend = false, sendOptions?: SendMessageOptions & RevertChatToOptions) {
                await client.get()?.revertChatTo(messageId, sendOptions || {});
                if (resend) {
                    return sendMessage([], sendOptions, true);
                } else {
                    updateUI(client.get()!);
                }
            },

            // 工具操作
            refreshTools,
            setTools(new_tools: UnionTool<any>[]) {
                tools.set(new_tools);
                refreshTools();
            },
            toggleToolCollapse,
            getToolUIRender,
            isFELocking: () => client.get()?.isFELocking(renderMessages.get()),

            // UI 切换
            toggleHistoryVisible,
            toggleGraphVisible() {
                showGraph.set(!showGraph.get());
                if (showGraph.get()) refreshGraph();
            },
            refreshGraph,

            // Agent 切换
            setCurrentAgent(agent: string) {
                currentAgent.set(agent);
                return initClient();
            },
            resumeFromInterrupt(data: any) {
                return sendMessage(
                    [],
                    {
                        command: {
                            resume: data,
                        },
                    },
                    true
                );
            },
            // 历史记录（兼容旧 API）
            addToHistory,
            createNewChat: createNewSession,
            toHistoryChat: (thread: Thread<{ messages: Message[] }>) => activateSession(thread.thread_id, true),
            async deleteHistoryChat(thread: Thread<{ messages: Message[] }>) {
                const historyManager = history.get();
                if (historyManager) {
                    await historyManager.deleteSession(thread.thread_id);
                    await refreshSessionList();
                }
            },

            // 分页和筛选操作
            setHistoryPage(page: number) {
                historyPagination.set({
                    ...historyPagination.get(),
                    page,
                });
                refreshSessionList();
            },
            setHistoryPageSize(pageSize: number) {
                historyPagination.set({
                    ...historyPagination.get(),
                    pageSize,
                    page: 1, // 重置到第一页
                });
                refreshSessionList();
            },
            setHistoryFilter(filter: Partial<HistoryFilter>) {
                historyFilter.set({
                    ...historyFilter.get(),
                    ...filter,
                });
                historyPagination.set({
                    ...historyPagination.get(),
                    page: 1, // 筛选变更时重置到第一页
                });
                refreshSessionList();
            },
            resetHistoryFilter() {
                historyFilter.set({
                    metadata: null,
                    status: null,
                    sortBy: "updated_at",
                    sortOrder: "desc",
                });
                historyPagination.set({
                    ...historyPagination.get(),
                    page: 1,
                });
                refreshSessionList();
            },

            ...artifactHook.mutation,
        },
    };
};
