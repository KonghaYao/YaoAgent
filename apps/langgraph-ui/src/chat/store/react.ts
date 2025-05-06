import { useStore } from "@nanostores/react";
import { StoreValue } from "nanostores";

export type UnionStore<T extends { data: Record<string, any>; mutations: Record<string, any> }> = {
    [k in keyof T["data"]]: StoreValue<T["data"][k]>;
} & T["mutations"];

export const useUnionStore = <T extends { data: Record<string, any>; mutations: Record<string, any> }>(store: T): UnionStore<T> => {
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
