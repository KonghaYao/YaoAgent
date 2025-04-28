import { LanguageModelLike } from "@langchain/core/language_models/base";
import { SystemMessage } from "@langchain/core/messages";
import { StructuredToolInterface } from "@langchain/core/tools";
import { Annotation, AnnotationRoot } from "@langchain/langgraph";
import { createReactAgent, createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { createHandoffTool, createSwarm, SwarmState } from "@langchain/langgraph-swarm";
import { createDefaultAnnotation } from "src/utils/index.js";

export const ExpertState = Annotation.Root({
    ...createReactAgentAnnotation().spec,
    ...SwarmState.spec,
    need_plan: createDefaultAnnotation(() => false),
});
export type ExpertState = typeof ExpertState.State;

export const createPlanNode = <T>(config: CreateNodeConfig<T>) => {
    const { llm, tools, stateModifier } = config.plannerConfig;
    return createReactAgent({
        name: "planner",
        llm,
        tools: [...tools, createHandoffTool({ agentName: "executor", description: "执行任务" })],
        prompt: stateModifier,
    });
};
export const createExecuteNode = <T>(config: CreateNodeConfig<T>) => {
    const { llm, tools, stateModifier } = config.executorConfig;
    return createReactAgent({
        name: "executor",
        llm,
        tools: [...tools, createHandoffTool({ agentName: "planner", description: "制定计划" })],
        prompt: stateModifier,
    });
};

export interface SubConfig {
    llm: LanguageModelLike;
    tools: StructuredToolInterface[];
    stateModifier: SystemMessage;
}
export interface CreateNodeConfig<T> {
    stateSchema?: typeof ExpertState;
    configSchema?: T;
    plannerConfig: SubConfig;
    executorConfig: SubConfig;
}

export const createExpert = <T extends AnnotationRoot<any>>(
    config: CreateNodeConfig<T>
): ReturnType<ReturnType<typeof createSwarm>["compile"]> => {
    return createSwarm({
        agents: [createExecuteNode(config), createPlanNode(config)],
        defaultActiveAgent: "executor",
        stateSchema: config.stateSchema || ExpertState,
    }).compile();
};
