import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";
import { ModelAllow, type ModelState } from "./states.js";

export const modelGuard = (state: typeof ModelState.State, model_type: keyof typeof ModelAllow) => {
    const modelName = state[model_type];
    if (!modelName) {
        throw new Error(`Model ${String(model_type)} not found in state`);
    }
    if (!(ModelAllow[model_type] as any as string[]).includes(modelName)) {
        throw new Error(`Not Allowed Model ${String(model_type)} `);
    }
    return modelName as string;
};
export async function createLLM(
    state: typeof ModelState.State,
    model_type: keyof typeof ModelAllow,
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
        streamUsage: true,
        streaming: true,
    });
}
