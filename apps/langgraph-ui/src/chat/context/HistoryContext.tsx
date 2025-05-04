import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { LangGraphClient } from "@langgraph-js/sdk";
import { useChat } from "./ChatContext";

type Thread = {
    thread_id: string;
    created_at: string;
    metadata: Record<string, any> | null;
};

interface HistoryContextType {
    threads: Thread[];
    currentChatId: string | null;
    setCurrentChatId: (id: string | null) => void;
    addChat: (thread: Thread) => void;
    refreshThreads: () => Promise<void>;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const useHistory = () => {
    const context = useContext(HistoryContext);
    if (!context) {
        throw new Error("useHistory must be used within a HistoryProvider");
    }
    return context;
};

interface HistoryProviderProps {
    children: ReactNode;
}

export const HistoryProvider: React.FC<HistoryProviderProps> = ({ children }) => {
    const { client } = useChat();
    const [threads, setThreads] = useState<Thread[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    const refreshThreads = useCallback(async () => {
        if (!client) return;
        try {
            const response = await client.listThreads();
            setThreads(
                response.map((thread) => ({
                    thread_id: thread.thread_id,
                    created_at: thread.created_at,
                    metadata: thread.metadata || null,
                }))
            );
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        }
    }, [client]);

    const addChat = useCallback((thread: Thread) => {
        setThreads((prev) => [thread, ...prev]);
    }, []);

    React.useEffect(() => {
        refreshThreads();
    }, [refreshThreads]);

    const value = {
        threads,
        currentChatId,
        setCurrentChatId,
        addChat,
        refreshThreads,
    };

    return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
};
