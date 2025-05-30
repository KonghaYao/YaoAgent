import { StructuredTool } from "@langchain/core/tools";
import { GraphState } from "../state.js";
import { ConfigurationState } from "../state.js";
import { createNoteTool } from "./memory.js";
import { LangGraphRunnableConfig } from "@langchain/langgraph";

export function initializeTools<State extends typeof GraphState.State>(
    state: State,
    config?: LangGraphRunnableConfig<typeof ConfigurationState.State>
): StructuredTool[] {
    return [...createNoteTool(state, config)];
}
