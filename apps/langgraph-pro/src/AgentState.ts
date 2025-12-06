import { z } from "zod";
import { BaseMessage } from "@langchain/core/messages";
import { withLangGraph } from "@langchain/langgraph/zod";
import { MessagesZodMeta } from "@langchain/langgraph";

/** zod schema for agent state */
export const AgentState = z.object({
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta).default([]),
});

/** 合并两个 state，保证合并正确。messages 和 task_store 都会被合并 */
export const mergeState = <T extends { messages: BaseMessage[]; task_store?: Record<string, any> }>(state: T, data: Partial<T>): T => {
    return {
        ...state,
        ...data,
        messages: [...state.messages, ...(data.messages || [])],
        task_store: {
            ...state.task_store,
            ...(data.task_store || {}),
        },
    };
};
