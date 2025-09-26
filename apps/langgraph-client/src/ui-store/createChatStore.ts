import { atom, computed } from "nanostores";
import { LangGraphClient, LangGraphClientConfig, RenderMessage, SendMessageOptions } from "../LangGraphClient.js";
import { AssistantGraph, Client, Message, Thread } from "@langchain/langgraph-sdk";
import { debounce } from "ts-debounce";
import { ToolRenderData } from "../tool/ToolUI.js";
import { UnionTool } from "../tool/createTool.js";
import { createLangGraphServerClient } from "../client/LanggraphServer.js";

/**
 * @zh 格式化日期对象为时间字符串。
 * @en Formats a Date object into a time string.
 */
export const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US");
};

/**
 * @zh 格式化数字为带千位分隔符的字符串。
 * @en Formats a number into a string with thousand separators.
 */
export const formatTokens = (tokens: number) => {
    return tokens.toLocaleString("en");
};

/**
 * @zh 获取消息内容的文本表示，处理不同类型的消息内容。
 * @en Gets the text representation of message content, handling different types of message content.
 */
export const getMessageContent = (content: any) => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
        return content
            .map((item) => {
                if (typeof item === "string") return item;
                if (item.type === "text") return item.text;
                if (item.type === "image_url") return `[图片]`;
                return JSON.stringify(item);
            })
            .join("");
    }
    return JSON.stringify(content);
};

/**
 * @zh 获取历史记录中 Thread 内容的文本表示。
 * @en Gets the text representation of Thread content in history.
 */
export const getHistoryContent = (thread: Thread) => {
    const content = (thread?.values as any)?.messages?.[0]?.content;
    if (content && Array.isArray(content)) {
        return content.map((item: any) => {
            if (item.type === "text") {
                return item.text;
            }
        });
    } else if (typeof content === "string") {
        return content;
    } else {
        return "";
    }
};

/**
 * @zh 创建一个用于聊天界面的状态管理器 (store)。
 * @en Creates a state manager (store) for the chat interface.
 */
export const createChatStore = (
    initClientName: string,
    config: Partial<LangGraphClientConfig>,
    context: {
        showHistory?: boolean;
        showGraph?: boolean;
        onInit?: (client: LangGraphClient) => void;
    } = {}
) => {
    const client = atom<LangGraphClient | null>(null);
    const renderMessages = atom<RenderMessage[]>([]);
    const userInput = atom<string>("");
    const loading = atom<boolean>(false);
    const collapsedTools = atom<string[]>([]);
    const inChatError = atom<string | null>(null);
    const showHistory = atom<boolean>(context.showHistory ?? false);
    const currentAgent = atom<string>(initClientName);
    const currentChatId = atom<string | null>(null);
    const currentNodeName = atom<string>("__start__");

    const tools = atom<UnionTool<any>[]>([]);
    const refreshTools = async () => {
        const c = client.get();
        if (!c) return;
        c.tools.clearTools();
        c.tools.bindTools(tools.get());
    };

    // 显示 langgraph 可视化图
    const showGraph = atom<boolean>(context.showGraph ?? false);
    const graphVisualize = atom<AssistantGraph | null>(null);
    const refreshGraph = async () => {
        if (showGraph.get()) graphVisualize.set((await client.get()?.graphVisualize()) || null);
    };
    const updateUI = debounce((newClient: LangGraphClient) => {
        const messages = newClient.renderMessage;
        const lastMessage = messages[messages.length - 1];

        currentNodeName.set(lastMessage?.node_name || lastMessage?.name || "__start__");

        renderMessages.set(messages);
    }, 10);
    /**
     * @zh 初始化 LangGraph 客户端。
     * @en Initializes the LangGraph client.
     */
    async function initClient() {
        const newClient = new LangGraphClient({
            ...config,
            client: config.client ?? (await createLangGraphServerClient(config as LangGraphClientConfig)),
        });
        await newClient.initAssistant(currentAgent.get());
        currentAgent.set(newClient.getCurrentAssistant()!.graph_id);
        // 不再需要创建，sendMessage 会自动创建
        // await newClient.createThread();
        inChatError.set(null);
        // 监听流开始事件
        newClient.on("start", () => {
            loading.set(true);
        });

        // 监听 Thread 创建和流完成事件
        newClient.on("thread", () => {
            currentChatId.set(newClient.getCurrentThread()?.thread_id || null);
            // 创建新流程时，默认为 __start__
            currentNodeName.set("__start__");
            // 创建新会话时，需要自动刷新历史面板
            refreshHistoryList();
        });

        newClient.on("done", () => {
            loading.set(false);
            updateUI(newClient);
        });

        // 监听错误事件
        newClient.on("error", (event) => {
            loading.set(false);
            inChatError.set(event.data);
        });

        // 监听消息和值更新事件
        newClient.on("message", () => {
            currentChatId.set(newClient.getCurrentThread()?.thread_id || null);
            updateUI(newClient);
        });

        newClient.on("value", () => {
            currentChatId.set(newClient.getCurrentThread()?.thread_id || null);
            updateUI(newClient);
        });
        context.onInit?.(newClient);
        newClient.graphState = {};
        client.set(newClient);
        if (showGraph.get()) refreshGraph();
        refreshTools();
        return newClient;
    }

    /**
     * @zh 发送消息。
     * @en Sends a message.
     */
    const sendMessage = async (message?: Message[], extraData?: SendMessageOptions) => {
        if ((!userInput.get().trim() && !message?.length) || loading.get() || !client.get()) return;

        loading.set(true);
        inChatError.set(null);
        try {
            await client.get()?.sendMessage(message || userInput.get(), extraData);
        } catch (e) {
            const isThreadRunning = (e as Error).message.includes("422");
            if (isThreadRunning) {
                await client.get()?.resetStream();
            }
        } finally {
            userInput.set("");
            loading.set(false);
        }
    };

    /**
     * @zh 停止当前的消息生成。
     * @en Stops the current message generation.
     */
    const stopGeneration = () => {
        client.get()?.cancelRun();
    };

    /**
     * @zh 切换工具消息的折叠状态。
     * @en Toggles the collapsed state of a tool message.
     */
    const toggleToolCollapse = (toolId: string) => {
        const prev = collapsedTools.get();
        collapsedTools.set(prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]);
    };

    /**
     * @zh 切换历史记录面板的可见性。
     * @en Toggles the visibility of the history panel.
     */
    const toggleHistoryVisible = () => {
        showHistory.set(!showHistory.get());
        if (showHistory.get()) {
            refreshHistoryList();
        }
    };

    const historyList = atom<Thread<{ messages: Message[] }>[]>([]);

    /**
     * @zh 刷新历史记录列表。
     * @en Refreshes the history list.
     */
    const refreshHistoryList = async () => {
        if (!client.get() || !showHistory.get()) return;
        try {
            const response = await client.get()?.listThreads();
            historyList.set((response as Thread<{ messages: Message[] }>[]) || []);
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        }
    };

    /**
     * @zh 将一个 Thread 添加到历史记录列表的开头。
     * @en Adds a Thread to the beginning of the history list.
     */
    const addToHistory = (thread: Thread<{ messages: Message[] }>) => {
        const prev = historyList.get();
        historyList.set([thread, ...prev]);
    };
    const getToolUIRender = (tool_name: string) => {
        const toolsDefine = client.get()!.tools.getAllTools();
        const tool = toolsDefine.find((i) => i.name === tool_name!)?.render;
        return tool ? (message: RenderMessage) => tool(new ToolRenderData(message, client.get()!)) : null;
    };

    return {
        data: {
            client,
            renderMessages,
            userInput,
            loading,
            inChatError,
            currentAgent,
            collapsedTools,
            showHistory,
            historyList,
            currentChatId,
            showGraph,
            graphVisualize,
            currentNodeName,
            tools,
        },
        mutations: {
            refreshTools,
            setTools(new_tools: UnionTool<any>[]) {
                tools.set(new_tools);
                refreshTools();
            },
            isFELocking() {
                return client.get()?.isFELocking(renderMessages.get());
            },
            initClient,
            sendMessage,
            stopGeneration,
            toggleToolCollapse,
            toggleHistoryVisible,
            refreshHistoryList,
            addToHistory,
            /**
             * @zh 设置用户输入内容。
             * @en Sets the user input content.
             */
            setUserInput(input: string) {
                userInput.set(input);
            },
            /**
             * @zh 设置当前的 Agent 并重新初始化客户端。
             * @en Sets the current Agent and reinitializes the client.
             */
            setCurrentAgent(agent: string) {
                currentAgent.set(agent);
                return initClient().then(() => {
                    if (showHistory.get()) {
                        refreshHistoryList();
                    }
                });
            },
            toggleGraphVisible() {
                showGraph.set(!showGraph.get());
                if (showGraph.get()) {
                    refreshGraph();
                }
            },
            refreshGraph,
            /**
             * @zh 创建一个新的聊天会话。
             * @en Creates a new chat session.
             */
            createNewChat() {
                client.get()?.reset();
                inChatError.set(null);
                loading.set(false);
            },
            /**
             * @zh 切换到指定的历史聊天会话。
             * @en Switches to the specified historical chat session.
             */
            async toHistoryChat(
                thread: Thread<{
                    messages: Message[];
                }>
            ) {
                inChatError.set(null);
                loading.set(false);
                const nowThread = await client.get()?.resetThread(thread.metadata?.graph_id as string, thread.thread_id);
                if (nowThread) {
                    client.get()?.resetStream();
                }
                return nowThread;
            },
            /**
             * @zh 删除指定的历史聊天会话。
             * @en Deletes the specified historical chat session.
             */
            async deleteHistoryChat(thread: Thread<{ messages: Message[] }>) {
                await client.get()?.deleteThread(thread.thread_id);
                await refreshHistoryList();
            },
            getToolUIRender,
        },
    };
};
