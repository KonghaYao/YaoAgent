import { AIMessage, HumanMessage, RemoveMessage, SystemMessage, trimMessages } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";
import { createLLM } from "../model/llm.js";
import { ModelState } from "../model/states.js";
import { createDefaultAnnotation } from "../utils/index.js";

export const MemoryState = Annotation.Root({
    ...ModelState.spec,
    max_memory_count: createDefaultAnnotation(() => 12),
});
export type MemoryState = typeof MemoryState.State;

// 短期记忆体，用于记录用户与AI的对话历史，并根据用户的问题给出回答
export const MemoryNode = async (state: MemoryState) => {
    const model = await createLLM(state, "memory_model");
    const messages = state.messages;
    const maxLoop = state.max_memory_count;
    if (messages.filter((msg) => msg instanceof HumanMessage).length > maxLoop) {
        const history = await trimMessages(messages, {
            strategy: "first",
            maxTokens: maxLoop / 2,
            includeSystem: false,
            tokenCounter: (message) => {
                return message.length;
            },
        });

        const targetId = history[history.length - 1].id;
        const targetIndex = messages.findIndex((msg) => msg.id === targetId);
        const frontMessages = messages.slice(0, targetIndex);

        const result = await model.invoke([
            new SystemMessage("你的任务是总结你和用户的对话，记录必要的信息"),
            ...frontMessages,
            new HumanMessage("请总结上面的对话"),
        ]);

        return {
            messages: [
                ...frontMessages.map(
                    (msg) =>
                        new RemoveMessage({
                            id: msg.id!,
                        })
                ),
                new AIMessage(result.content + "\n我将继续帮助用户"),
            ],
        };
    }
    return {};
};
