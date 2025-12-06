import { InteropZodObject } from "@langchain/core/utils/types";
import { ChatOpenAICompletions } from "../openai/completion.js";
import { createMiddleware } from "langchain";
import { BaseChatOpenAIFields } from "@langchain/openai";

/**
 * 根据 state.model_name 决定模型名称
 * @example
 * ```typescript
 * const middleware = createDynamicModelMiddleware(stateSchema, "model_name");
 * ```
 */
export const createDynamicModelMiddleware = <T extends InteropZodObject>(stateSchema: T, keyInState: string = "model_name", options?: BaseChatOpenAIFields) => {
    return createMiddleware({
        stateSchema,
        name: "dynamic_model_middleware",
        wrapModelCall: async (request, handler) => {
            const model = new ChatOpenAICompletions({
                ...options,
                /** @ts-ignore */
                modelName: request.state[keyInState],
                streaming: true,
                streamUsage: true,
            });

            return await handler({ ...request, model });
        },
    });
};
