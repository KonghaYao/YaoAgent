import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { LangGraphClient, type RenderMessage } from "@langgraph-js/sdk";
import { askUserTool, fileTool } from "../tools";
import { useHistory } from "./HistoryContext";

interface ChatContextType {
    client: LangGraphClient | null;
    messages: RenderMessage[];
    input: string;
    loading: boolean;
    collapsedTools: string[];
    error: string | null;
    showHistory: boolean;
    currentAgent: string;
    setInput: (input: string) => void;
    sendMessage: () => Promise<void>;
    interruptMessage: () => void;
    toggleToolCollapse: (toolId: string) => void;
    toggleHistory: () => void;
    setCurrentAgent: (agent: string) => void;
    formatTime: (date: Date) => string;
    formatTokens: (tokens: number) => string;
    getMessageContent: (content: any) => string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const [client, setClient] = useState<LangGraphClient | null>(null);
    const [messages, setMessages] = useState<RenderMessage[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [collapsedTools, setCollapsedTools] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [showHistory, setShowHistory] = useState(true);
    const [currentAgent, setCurrentAgent] = useState("agent");

    const formatTime = useCallback((date: Date) => {
        return date.toLocaleTimeString("en-US");
    }, []);

    const formatTokens = useCallback((tokens: number) => {
        return tokens.toLocaleString("en");
    }, []);

    const getMessageContent = useCallback((content: any) => {
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
    }, []);

    const initClient = useCallback(async () => {
        const newClient = new LangGraphClient({
            apiUrl: "http://localhost:8123",
        });
        await newClient.initAssistant(currentAgent);
        // 不再需要创建，sendMessage 会自动创建
        // await newClient.createThread();

        newClient.onStreamingUpdate((event) => {
            if (event.type === "error") {
                setLoading(false);
                setError(event.data?.message || "发生错误");
            }
            setMessages(newClient.renderMessage);
        });
        newClient.tools.bindTools([fileTool, askUserTool]);
        newClient.graphState = {};
        setClient(newClient);
    }, [currentAgent]);

    const sendMessage = useCallback(async () => {
        if (!input.trim() || loading || !client) return;

        setLoading(true);
        setError(null);

        await client.sendMessage(input);

        setInput("");
        setLoading(false);
    }, [input, loading, client, currentAgent]);

    const interruptMessage = useCallback(() => {
        client?.cancelRun();
    }, [client]);

    const toggleToolCollapse = useCallback((toolId: string) => {
        setCollapsedTools((prev) => (prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]));
    }, []);

    const toggleHistory = useCallback(() => {
        setShowHistory((prev) => !prev);
    }, []);

    React.useEffect(() => {
        initClient();
    }, [initClient, currentAgent]);

    const value = {
        client,
        messages,
        input,
        loading,
        collapsedTools,
        error,
        showHistory,
        currentAgent,
        setInput,
        sendMessage,
        interruptMessage,
        toggleToolCollapse,
        toggleHistory,
        setCurrentAgent,
        formatTime,
        formatTokens,
        getMessageContent,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
