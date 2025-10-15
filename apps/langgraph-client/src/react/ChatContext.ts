import { createElement, createContext, useContext, useMemo, ReactNode, useEffect, useRef } from "react";

import { createChatStore, UnionStore, useUnionStore } from "../ui-store/index.js";
import { useStore } from "@nanostores/react";

const ChatContext = createContext<UnionStore<ReturnType<typeof createChatStore>> | undefined>(undefined);

export const useChat = () => {
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
    defaultHeaders,
    withCredentials = false,
    showHistory = false,
    showGraph = false,
    onInitError,
}) => {
    // 使用 useMemo 稳定 defaultHeaders 的引用
    const stableHeaders = useMemo(() => defaultHeaders || {}, [defaultHeaders]);

    // 使用 useRef 保存 onInitError 的最新引用
    const onInitErrorRef = useRef(onInitError);
    useEffect(() => {
        onInitErrorRef.current = onInitError;
    }, [onInitError]);

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
                defaultHeaders: stableHeaders,
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
    }, [defaultAgent, apiUrl, stableHeaders, withCredentials, showHistory, showGraph]);

    const unionStore = useUnionStore(store, useStore);

    // 使用 ref 标记是否已初始化
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }
        initializedRef.current = true;

        unionStore
            .initClient()
            .then((res) => {
                if (unionStore.showHistory) {
                    unionStore.refreshHistoryList();
                }
            })
            .catch((err) => {
                console.error(err);
                if (onInitErrorRef.current) {
                    onInitErrorRef.current(err, unionStore.currentAgent);
                }
            });
    }, [unionStore]);

    return createElement(ChatContext.Provider, { value: unionStore }, children);
};
