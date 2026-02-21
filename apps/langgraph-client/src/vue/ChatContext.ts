import { defineComponent, inject, provide, onMounted, defineExpose, type InjectionKey, type PropType, Ref } from "vue";
import { createChatStore, HistoryFilter } from "../ui-store/index.js";
import { useStore } from "@nanostores/vue";
import { PreinitializedWritableAtom, StoreValue } from "nanostores";
import { ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";

/**
 * @zh UnionStore 类型用于合并 store 的 data 和 mutations，使其可以直接访问。
 * @en The UnionStore type is used to merge the data and mutations of a store, allowing direct access.
 */
export type UnionStoreVue<T extends { data: Record<string, PreinitializedWritableAtom<any>>; mutations: Record<string, any> }> = {
    [k in keyof T["data"]]: Readonly<Ref<StoreValue<T["data"][k]>>>;
} & T["mutations"];

/**
 * @zh useUnionStore Hook 用于将 nanostores 的 store 结构转换为更易于在 UI 组件中使用的扁平结构。
 * @en The useUnionStore Hook is used to transform the nanostores store structure into a flatter structure that is easier to use in UI components.
 */
export const useUnionStoreVue = <T extends { data: Record<string, any>; mutations: Record<string, any> }>(
    store: T,
    useStore: (store: PreinitializedWritableAtom<any>) => Readonly<Ref<any>>
): UnionStoreVue<T> => {
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

// 定义注入的 key，提供完整类型
const ChatContextKey: InjectionKey<UnionStoreVue<ReturnType<typeof createChatStore>>> = Symbol("ChatContext");

/**
 * 使用 Chat Store 的组合式函数
 * @throws {Error} 如果在 ChatProvider 外部使用会抛出错误
 */
export const useChat = (): UnionStoreVue<ReturnType<typeof createChatStore>> => {
    const context = inject(ChatContextKey);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};

export interface ChatProviderProps {
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
    historyFilter?: HistoryFilter;
    /** UI 更新的防抖时间（毫秒，默认 10） */
    debounceTime?: number;
}

/**
 * @zh Chat Provider Hook，用于在 setup 中直接使用
 * @en Chat Provider Hook, used directly in setup
 */
export const useChatProvider = (props: ChatProviderProps) => {
    const baseFetch = props.fetch || globalThis.fetch;
    const F = props.withCredentials
        ? (url: string, options: RequestInit) => {
              options.credentials = "include";
              return baseFetch(url, options);
          }
        : baseFetch;

    const store = createChatStore(
        props.defaultAgent || "",
        {
            apiUrl: props.apiUrl,
            defaultHeaders: props.defaultHeaders,
            callerOptions: {
                fetch: F,
                maxRetries: 1,
            },
            client: props.client,
            legacyMode: props.legacyMode,
        },
        {
            showHistory: props.showHistory,
            showGraph: props.showGraph,
            fallbackToAvailableAssistants: props.fallbackToAvailableAssistants,
            autoRestoreLastSession: props.autoRestoreLastSession,
            historyFilter: props.historyFilter,
            debounceTime: props.debounceTime,
        }
    );

    const unionStore = useUnionStoreVue(store, useStore);

    // 提供 store 给子组件
    provide(ChatContextKey, unionStore);

    // 初始化客户端
    onMounted(() => {
        unionStore.initClient().catch((err) => {
            console.error(err);
            if (props.onInitError) {
                props.onInitError(err, unionStore.currentAgent.value);
            }
        });
    });

    return {
        unionStore,
    };
};

/**
 * Chat Provider 组件
 * 提供 Chat Store 的上下文
 */
export const ChatProvider = defineComponent({
    name: "ChatProvider",
    props: {
        defaultAgent: {
            type: String as PropType<string>,
            default: "",
        },
        apiUrl: {
            type: String as PropType<string>,
            default: "http://localhost:8123",
        },
        defaultHeaders: {
            type: Object as PropType<Record<string, string>>,
            default: () => ({}),
        },
        withCredentials: {
            type: Boolean as PropType<boolean>,
            default: false,
        },
        fetch: {
            type: Function as PropType<typeof fetch>,
            default: undefined,
        },
        showHistory: {
            type: Boolean as PropType<boolean>,
            default: false,
        },
        showGraph: {
            type: Boolean as PropType<boolean>,
            default: false,
        },
        autoRestoreLastSession: {
            type: Boolean as PropType<boolean>,
            default: false,
        },
        onInitError: {
            type: Function as PropType<(error: any, currentAgent: string) => void>,
            default: undefined,
        },
        historyFilter: {
            type: Object as PropType<any>,
            default: undefined,
        },
        debounceTime: {
            type: Number as PropType<number>,
            default: undefined,
        },
    },
    setup(props, { slots }) {
        const { unionStore } = useChatProvider(props);

        defineExpose({
            unionStore,
        });

        return () => {
            return slots.default?.();
        };
    },
});
