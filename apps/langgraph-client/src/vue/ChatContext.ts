import { defineComponent, inject, provide, onMounted, defineExpose, type InjectionKey, type PropType, Ref } from "vue";
import { createChatStore } from "../ui-store/index.js";
import { useStore } from "@nanostores/vue";
import { PreinitializedWritableAtom, StoreValue } from "nanostores";

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
    showHistory?: boolean;
    showGraph?: boolean;
    onInitError?: (error: any, currentAgent: string) => void;
}

/**
 * @zh Chat Provider Hook，用于在 setup 中直接使用
 * @en Chat Provider Hook, used directly in setup
 */
export const useChatProvider = (props: ChatProviderProps) => {
    const F = props.withCredentials
        ? (url: string, options: RequestInit) => {
              options.credentials = "include";
              return fetch(url, options);
          }
        : fetch;

    const store = createChatStore(
        props.defaultAgent || "",
        {
            apiUrl: props.apiUrl,
            defaultHeaders: props.defaultHeaders,
            callerOptions: {
                fetch: F,
                maxRetries: 1,
            },
        },
        {
            showHistory: props.showHistory,
            showGraph: props.showGraph,
        }
    );

    const unionStore = useUnionStoreVue(store, useStore);

    // 提供 store 给子组件
    provide(ChatContextKey, unionStore);

    // 初始化客户端
    onMounted(() => {
        unionStore
            .initClient()
            .then(() => {
                if (unionStore.showHistory) {
                    unionStore.refreshHistoryList();
                }
            })
            .catch((err) => {
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
        showHistory: {
            type: Boolean as PropType<boolean>,
            default: false,
        },
        showGraph: {
            type: Boolean as PropType<boolean>,
            default: false,
        },
        onInitError: {
            type: Function as PropType<(error: any, currentAgent: string) => void>,
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
