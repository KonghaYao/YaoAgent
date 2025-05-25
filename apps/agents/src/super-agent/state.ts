import { Annotation, BaseStore } from "@langchain/langgraph";
import { ExpertState } from "../create-expert/index.js";
import { ModelState } from "../model/index.js";
import { McpState } from "./tools/mcp.js";
import { createState, FEToolsState } from "@langgraph-js/pro";
export const GraphState = createState(ExpertState, ModelState, FEToolsState, McpState).build({});
export type GraphState = typeof GraphState.State;

export const ConfigurationState = createState().build({
    store: Annotation<BaseStore>(),
    metadata: Annotation<{
        userId: string;
    }>(),
});
