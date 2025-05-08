import { atom } from "nanostores";
import { LangGraphClient, LangGraphClientConfig, RenderMessage, SendMessageOptions } from "../LangGraphClient";
import { Message, Thread } from "@langchain/langgraph-sdk";
export const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US");
};

export const formatTokens = (tokens: number) => {
    return tokens.toLocaleString("en");
};
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
export const createChatStore = (
    initClientName: string,
    config: LangGraphClientConfig,
    context: {
        onInit?: (client: LangGraphClient) => void;
    } = {}
) => {
    const client = atom<LangGraphClient | null>(null);
    const renderMessages = atom<RenderMessage[]>([]);
    const userInput = atom<string>("");
    const loading = atom<boolean>(false);
    const collapsedTools = atom<string[]>([]);
    const inChatError = atom<string | null>(null);
    const showHistory = atom<boolean>(true);
    const currentAgent = atom<string>(initClientName);
    const currentChatId = atom<string | null>(null);

    const initClient = async () => {
        const newClient = new LangGraphClient(config);
        await newClient.initAssistant(currentAgent.get());
        // 不再需要创建，sendMessage 会自动创建
        // await newClient.createThread();

        newClient.onStreamingUpdate((event) => {
            if (event.type === "thread" || event.type === "done") {
                // console.log(event.data);
                // 创建新会话时，需要自动刷新历史面板
                return refreshHistoryList();
            }
            if (event.type === "error") {
                loading.set(false);
                inChatError.set(event.data?.message || "发生错误");
            }
            // console.log(newClient.renderMessage);
            renderMessages.set(newClient.renderMessage);
        });
        context.onInit?.(newClient);
        // newClient.tools.bindTools([fileTool, askUserTool]);
        newClient.graphState = {};
        client.set(newClient);
    };

    const sendMessage = async (message?: Message[], extraData?: SendMessageOptions) => {
        if ((!userInput.get().trim() && !message?.length) || loading.get() || !client.get()) return;

        loading.set(true);
        inChatError.set(null);

        await client.get()?.sendMessage(message || userInput.get(), extraData);

        userInput.set("");
        loading.set(false);
    };

    const stopGeneration = () => {
        client.get()?.cancelRun();
    };

    const toggleToolCollapse = (toolId: string) => {
        const prev = collapsedTools.get();
        collapsedTools.set(prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]);
    };

    const toggleHistoryVisible = () => {
        showHistory.set(!showHistory.get());
    };
    const historyList = atom<Thread<{ messages: Message[] }>[]>([]);
    const refreshHistoryList = async () => {
        if (!client.get()) return;
        try {
            const response = await client.get()?.listThreads<{ messages: Message[] }>();
            historyList.set(response || []);
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        }
    };

    const addToHistory = (thread: Thread<{ messages: Message[] }>) => {
        const prev = historyList.get();
        historyList.set([thread, ...prev]);
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
        },
        mutations: {
            initClient,
            sendMessage,
            stopGeneration,
            toggleToolCollapse,
            toggleHistoryVisible,
            refreshHistoryList,
            addToHistory,
            setUserInput(input: string) {
                userInput.set(input);
            },
            setCurrentAgent(agent: string) {
                currentAgent.set(agent);
                return initClient().then(() => {
                    refreshHistoryList();
                });
            },
            createNewChat() {
                client.get()?.reset();
            },
            toHistoryChat(
                thread: Thread<{
                    messages: Message[];
                }>
            ) {
                client.get()?.resetThread(thread.metadata?.graph_id as string, thread.thread_id);
            },
            async deleteHistoryChat(thread: Thread<{ messages: Message[] }>) {
                await client.get()?.threads.delete(thread.thread_id);
                await refreshHistoryList();
            },
        },
    };
};
