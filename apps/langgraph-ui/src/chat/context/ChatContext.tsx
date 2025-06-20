import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
type ChatContextType = UnionStore<typeof globalChatStore>;

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
import { globalChatStore } from "../store";
import { UnionStore, useUnionStore } from "@langgraph-js/sdk";
import { useStore } from "@nanostores/react";
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const store = useUnionStore(globalChatStore, useStore);
    useEffect(() => {
        store
            .initClient()
            .then((res) => {
                if (store.showHistory) {
                    store.refreshHistoryList();
                }
                console.log(res);
            })
            .catch((err) => {
                console.error(err);
                const agentName = prompt("Failed to initialize chat client: " + store.currentAgent + "\n请输入 agent 名称");
                localStorage.setItem("agent_name", agentName!);
                location.reload();
            });
    }, []);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
