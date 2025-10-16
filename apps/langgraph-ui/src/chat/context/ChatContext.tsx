import React, { createContext, useContext, useMemo, ReactNode, useEffect } from "react";
import { createChatStore } from "@langgraph-js/sdk";
import { UnionStore, useUnionStore } from "@langgraph-js/sdk";
import { useStore } from "@nanostores/react";

type ChatContextType = UnionStore<ReturnType<typeof createChatStore>>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
    defaultAgent?: string;
    apiUrl?: string;
    defaultHeaders?: Record<string, string>;
    withCredentials?: boolean;
    showHistory?: boolean;
    showGraph?: boolean;
    onInitError?: (error: any, currentAgent: string) => void;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
    children,
    defaultAgent = "",
    apiUrl = "http://localhost:8123",
    defaultHeaders = {},
    withCredentials = false,
    showHistory = false,
    showGraph = false,
    onInitError,
}) => {
    const store = useMemo(() => {
        const F = withCredentials
            ? (url: string, options: RequestInit) => {
                  options.credentials = "include";
                  return fetch(url, options);
              }
            : fetch;

        return createChatStore(
            defaultAgent,
            {
                apiUrl,
                defaultHeaders,
                callerOptions: {
                    fetch: F,
                    maxRetries: 1,
                },
            },
            {
                showHistory,
                showGraph,
            }
        );
    }, [defaultAgent, apiUrl, defaultHeaders, withCredentials, showHistory, showGraph]);

    const unionStore = useUnionStore(store, useStore);

    useEffect(() => {
        unionStore
            .initClient()
            .then((res) => {
                if (unionStore.showHistory) {
                    unionStore.refreshHistoryList();
                }
            })
            .catch((err) => {
                console.error(err);
                if (onInitError) {
                    onInitError(err, unionStore.currentAgent);
                }
            });
    }, [unionStore, onInitError]);

    return <ChatContext.Provider value={unionStore}>{children}</ChatContext.Provider>;
};
