import { LanguageModelLike } from "@langchain/core/language_models/base";
import { AIMessage, SystemMessage } from "@langchain/core/messages";
import { StructuredToolInterface } from "@langchain/core/tools";
import { Annotation, AnnotationRoot, END, MessagesAnnotation, START, StateGraph } from "@langchain/langgraph";
import { createReactAgent, createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";

export const ExpertState = Annotation.Root({
    ...createReactAgentAnnotation().spec,
    need_plan: Annotation<Boolean>({
        reducer: (a) => a,
        default: () => false,
    }),
});
export type ExpertState = typeof ExpertState.State;

export const createPlanNode = <T>(config: CreateNodeConfig<T>) => {
    const { llm, tools, stateModifier } = config.plannerConfig;
    return async (state: ExpertState) => {
        const agent = createReactAgent({
            llm,
            tools,
            prompt: stateModifier,
        });
        const res = await agent.invoke({
            messages: state.messages,
        });
        return { messages: [...res.messages, new AIMessage("计划已完毕")] };
    };
};
export const createExecuteNode = <T>(config: CreateNodeConfig<T>) => {
    const { llm, tools, stateModifier } = config.executorConfig;
    return async (state: ExpertState) => {
        const agent = createReactAgent({
            llm,
            tools,
            prompt: stateModifier,
        });
        const res = await agent.invoke({
            messages: state.messages,
        });
        return { messages: res.messages };
    };
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

export const createExpert = <T extends AnnotationRoot<any>>(config: CreateNodeConfig<T>) => {
    const builder = new StateGraph(ExpertState, config.configSchema);
    builder
        .addNode("plan", createPlanNode(config))
        .addNode("execute", createExecuteNode(config))
        .addConditionalEdges(START, (state) => {
            return state.need_plan ? "plan" : "execute";
        })
        .addEdge("plan", "execute")
        .addEdge("execute", END);

    return builder.compile();
};
