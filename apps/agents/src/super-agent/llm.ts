import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

export async function createLLM(
    model_name: string,
    params: {
        temperature?: number;
        maxTokens?: number;
        topP?: number;
        frequencyPenalty?: number;
        presencePenalty?: number;
        stop?: string[];
        timeout?: number;
        streaming?: boolean;
    } = {}
): Promise<BaseChatModel> {
    return new ChatOpenAI({
        modelName: model_name,
        ...params,
        configuration: {
            /** @ts-ignore */
            parallel_tool_calls: true,
        },
    });
}
