import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { AIMessage, HumanMessage, RemoveMessage, SystemMessage, trimMessages } from "@langchain/core/messages";
import { AgentState } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

// 短期记忆体，用于记录用户与AI的对话历史，并根据用户的问题给出回答
export const getMemMessages = (model: BaseLanguageModel, maxLoop: number) => {
    const summarizeMessages = async (state: AgentState) => {
        const messages = state.messages;
        if (messages.filter((msg) => msg instanceof HumanMessage).length > maxLoop) {
            const history = await trimMessages(messages, {
                strategy: "first",
                maxTokens: maxLoop * 4,
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

    return summarizeMessages;
};

export const shortTermMemoryNode = getMemMessages(new ChatOpenAI({ modelName: "qwen-turbo" }), 7);
