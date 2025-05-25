import { BinaryOperatorAggregate } from "@langchain/langgraph";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { createState, createDefaultAnnotation } from "@langgraph-js/pro";
/** 大模型允许值的定义，可以传入，第一个为默认值 */
export const ModelAllow = {
    main_model: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini"],
    memory_model: ["gpt-4.1-nano"],
    planner_model: ["gpt-4o-mini"],
    coordinator_model: ["gpt-4o-mini"],
    reporter_model: ["gpt-4o-mini"],
} as const;

export const ModelState = createState(createReactAgentAnnotation()).build({
    ...(Object.fromEntries(
        Object.entries(ModelAllow).map(([key, value]) => [key, createDefaultAnnotation(() => value[0])])
    ) as Record<keyof typeof ModelAllow, BinaryOperatorAggregate<string>>),
});
