import { PreinitializedWritableAtom, StoreValue } from "nanostores";

/**
 * @zh UnionStore 类型用于合并 store 的 data 和 mutations，使其可以直接访问。
 * @en The UnionStore type is used to merge the data and mutations of a store, allowing direct access.
 */
export type UnionStore<T extends { data: Record<string, PreinitializedWritableAtom<any>>; mutations: Record<string, any> }> = {
    [k in keyof T["data"]]: StoreValue<T["data"][k]>;
} & T["mutations"];

/**
 * @zh useUnionStore Hook 用于将 nanostores 的 store 结构转换为更易于在 UI 组件中使用的扁平结构。
 * @en The useUnionStore Hook is used to transform the nanostores store structure into a flatter structure that is easier to use in UI components.
 */
export const useUnionStore = <T extends { data: Record<string, any>; mutations: Record<string, any> }>(
    store: T,
    useStore: (store: PreinitializedWritableAtom<any>) => StoreValue<T["data"][keyof T["data"]]>
): UnionStore<T> => {
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
