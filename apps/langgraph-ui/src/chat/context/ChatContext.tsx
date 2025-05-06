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
import { UnionStore, useUnionStore } from "../store/react";
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    const store = useUnionStore(globalChatStore);
    useEffect(() => {
        store.initClient().then((res) => {
            store.refreshHistoryList();
        });
    }, [store.currentAgent]);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
