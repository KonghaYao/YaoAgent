import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Message, Thread } from "@langgraph-js/sdk";
import { useChat } from "./ChatContext";

interface HistoryContextType {
    threads: Thread<{ messages: Message[] }>[];
    currentChatId: string | null;
    setCurrentChatId: (id: string | null) => void;
    addChat: (thread: Thread<{ messages: Message[] }>) => void;
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
    const [threads, setThreads] = useState<Thread<{ messages: Message[] }>[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    const refreshThreads = useCallback(async () => {
        if (!client) return;
        try {
            const response = await client.listThreads<{ messages: Message[] }>();
            setThreads(response);
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        }
    }, [client]);

    const addChat = useCallback((thread: Thread<{ messages: Message[] }>) => {
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
