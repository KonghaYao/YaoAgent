import { Annotation, BaseStore } from "@langchain/langgraph";
import { ExpertState } from "../create-expert/index.js";
import { ModelState } from "../model/index.js";

export const GraphState = Annotation.Root({
    ...ExpertState.spec,
    ...ModelState.spec,
});
export type GraphState = typeof GraphState.State;

export const ConfigurationState = Annotation.Root({
    store: Annotation<BaseStore>(),
    metadata: Annotation<{
        userId: string;
    }>(),
});

export type ConfigurationState = typeof ConfigurationState.State;
