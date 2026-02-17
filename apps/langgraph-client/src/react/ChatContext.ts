import { createElement, createContext, useContext, useMemo, ReactNode, useEffect, useRef } from "react";

import { createChatStore, UnionStore, useUnionStore } from "../ui-store/index.js";
import { useStore } from "@nanostores/react";
import { ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";

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
    fetch?: typeof fetch;
    showHistory?: boolean;
    showGraph?: boolean;
    fallbackToAvailableAssistants?: boolean;
    /** 初始化时是否自动激活最近的历史会话（默认 false，创建新会话） */
    autoRestoreLastSession?: boolean;
    onInitError?: (error: any, currentAgent: string) => void;
    client?: ILangGraphClient;
    legacyMode?: boolean;
    /** 历史记录筛选的默认参数 */
    historyFilter?: import("../ui-store/createChatStore.js").HistoryFilter;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({
    children,
    defaultAgent = "",
    apiUrl = "http://localhost:8123",
    defaultHeaders,
    withCredentials = false,
    fetch,
    showHistory = false,
    showGraph = false,
    fallbackToAvailableAssistants = false,
    autoRestoreLastSession = false,
    onInitError,
    client,
    legacyMode = false,
    historyFilter,
}) => {
    // 使用 useMemo 稳定 defaultHeaders 的引用
    const stableHeaders = useMemo(() => defaultHeaders || {}, [defaultHeaders]);

    // 使用 useRef 保存 onInitError 的最新引用
    const onInitErrorRef = useRef(onInitError);
    useEffect(() => {
        onInitErrorRef.current = onInitError;
    }, [onInitError]);

    const store = useMemo(() => {
        const baseFetch = fetch || globalThis.fetch;
        const F = withCredentials
            ? (url: string, options: RequestInit) => {
                  options.credentials = "include";
                  return baseFetch(url, options);
              }
            : baseFetch;

        const config = {
            apiUrl,
            defaultHeaders: stableHeaders,
            callerOptions: {
                fetch: F,
                maxRetries: 1,
            },
            legacyMode,
        };
        /** @ts-ignore */
        if (client) config.client = client;
        return createChatStore(defaultAgent, config, {
            showHistory,
            showGraph,
            fallbackToAvailableAssistants,
            autoRestoreLastSession,
            historyFilter,
        });
    }, [defaultAgent, apiUrl, stableHeaders, withCredentials, fetch, showHistory, showGraph, fallbackToAvailableAssistants, autoRestoreLastSession, client, legacyMode, historyFilter]);

    const unionStore = useUnionStore(store, useStore);

    // 使用 ref 标记是否已初始化
    const initializedRef = useRef(false);

    useEffect(() => {
        if (initializedRef.current) {
            return;
        }
        initializedRef.current = true;

        unionStore.initClient().catch((err) => {
            console.error(err);
            if (onInitErrorRef.current) {
                onInitErrorRef.current(err, unionStore.currentAgent);
            }
        });
    }, [unionStore]);

    return createElement(ChatContext.Provider, { value: unionStore }, children);
};
