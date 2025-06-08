import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { createDefaultAnnotation, createState } from "./createState.js";
import { BinaryOperatorAggregate } from "@langchain/langgraph/web";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { ChatOpenAI } from "@langchain/openai";

/**
 * 创建模型状态和模型工具
 * @param ModelAllow 模型允许值的定义，可以传入，第一个为默认值
 * @returns 模型状态和模型工具
 * @example
 * const { ModelState, createLLM } = createModelHelper({
 *     main_model: ["gemini-2.5-flash"],
 * });
 * const GraphState = createState(ModelState).build({});
 * const llm = await createLLM(state, "main_model");
 */
export const createModelHelper = <const T extends Record<string, string[]>>(ModelAllow: T) => {
    const ModelState = createState(createReactAgentAnnotation()).build({
        ...(Object.fromEntries(Object.entries(ModelAllow).map(([key, value]) => [key, createDefaultAnnotation(() => value[0])])) as Record<keyof typeof ModelAllow, BinaryOperatorAggregate<string>>),
    });

    const modelGuard = (state: typeof ModelState.State, model_type: keyof typeof ModelAllow) => {
        const modelName = state[model_type];
        if (!modelName) {
            throw new Error(`Model ${String(model_type)} not found in state`);
        }
        if (!(ModelAllow[model_type] as any as string[]).includes(modelName)) {
            throw new Error(`Not Allowed Model ${String(model_type)} `);
        }
        return modelName as string;
    };
    async function createLLM(
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
    return {
        ModelState,
        createLLM,
    };
};
