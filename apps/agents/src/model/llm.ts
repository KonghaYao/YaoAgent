import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ModelState } from "./states.js";

export const modelGuard = (state: ModelState, model_type: keyof ModelState) => {
    const modelName = state[model_type];
    if (!modelName) {
        throw new Error(`Model ${String(model_type)} not found in state`);
    }
    return modelName;
};
export async function createLLM(
    state: ModelState,
    model_type: keyof ModelState,
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
    const modelName = modelGuard(state, model_type);
    return new ChatOpenAI({
        modelName,
        ...params,
        configuration: {
            /** @ts-ignore */
            parallel_tool_calls: true,
        },
    });
}
