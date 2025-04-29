import { Annotation, BinaryOperatorAggregate } from "@langchain/langgraph";
import { createDefaultAnnotation } from "src/utils/index.js";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
/** 大模型允许值的定义，可以传入，第一个为默认值 */
export const ModelAllow = {
    main_model: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
    memory_model: ["gpt-4.1-nano"],
} as const;

export type ModelState = typeof ModelState.State;

export const ModelState = Annotation.Root({
    ...createReactAgentAnnotation().spec,
    ...(Object.fromEntries(
        Object.entries(ModelAllow).map(([key, value]) => [key, createDefaultAnnotation(() => value[0])])
    ) as Record<keyof typeof ModelAllow, BinaryOperatorAggregate<string>>),
});
