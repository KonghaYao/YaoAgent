import { createContext, useContext, createMemo, onMount, type JSX, type Component, createComponent, Accessor } from "solid-js";
import { createChatStore, UnionStore } from "../ui-store/index.js";
import { useStore } from "@nanostores/solid";
import { ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";
import { PreinitializedWritableAtom, StoreValue } from "nanostores";

const ChatContext = createContext<UnionStoreSolid<ReturnType<typeof createChatStore>> | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};

interface ChatProviderProps {
    children: JSX.Element;
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
/**
 * @zh UnionStore 类型用于合并 store 的 data 和 mutations，使其可以直接访问。
 * @en The UnionStore type is used to merge the data and mutations of a store, allowing direct access.
 */
export type UnionStoreSolid<T extends { data: Record<string, PreinitializedWritableAtom<any>>; mutations: Record<string, any> }> = {
    [k in keyof T["data"]]: Accessor<StoreValue<T["data"][k]>>;
} & T["mutations"];

/**
 * @zh useUnionStore Hook 用于将 nanostores 的 store 结构转换为更易于在 UI 组件中使用的扁平结构。
 * @en The useUnionStore Hook is used to transform the nanostores store structure into a flatter structure that is easier to use in UI components.
 */
export const useUnionStoreSolid = <T extends { data: Record<string, any>; mutations: Record<string, any> }>(
    store: T,
    useStore: (store: PreinitializedWritableAtom<any>) => Accessor<any>
): UnionStoreSolid<T> => {
    const data: any = Object.fromEntries(
        Object.entries(store.data as any).map(([key, value]) => {
            return [key, useStore(value as any)];
        })
    );

    return {
        ...data,
        ...store.mutations,
    };
};

export const ChatProvider = (props: ChatProviderProps) => {
    // 使用 createMemo 稳定 defaultHeaders 的引用
    const stableHeaders = createMemo(() => props.defaultHeaders || {});

    // 使用 createMemo 创建 fetch 函数
    const F = createMemo(() => {
        const baseFetch = props.fetch || globalThis.fetch;
        return props.withCredentials
            ? (url: string, options: RequestInit) => {
                  options.credentials = "include";
                  return baseFetch(url, options);
              }
            : baseFetch;
    });

    const store = createMemo(() => {
        const config = {
            apiUrl: props.apiUrl || "http://localhost:8123",
            defaultHeaders: stableHeaders(),
            callerOptions: {
                fetch: F(),
                maxRetries: 1,
            },
            legacyMode: props.legacyMode || false,
        };
        /** @ts-ignore */
        if (props.client) config.client = props.client;
        return createChatStore(props.defaultAgent || "", config, {
            showHistory: props.showHistory || false,
            showGraph: props.showGraph || false,
            fallbackToAvailableAssistants: props.fallbackToAvailableAssistants || false,
            autoRestoreLastSession: props.autoRestoreLastSession || false,
            historyFilter: props.historyFilter,
        });
    });

    const unionStore = useUnionStoreSolid(store(), useStore);

    // 初始化标志
    let initialized = false;

    onMount(() => {
        if (initialized) {
            return;
        }
        initialized = true;
        unionStore.initClient().catch((err) => {
            console.error(err);
            if (props.onInitError) {
                props.onInitError(err, unionStore.currentAgent());
            }
        });
    });

    // 使用 createComponent 创建 Provider 组件
    return createComponent(ChatContext.Provider, {
        value: unionStore,
        get children() {
            return props.children;
        },
    });
};
