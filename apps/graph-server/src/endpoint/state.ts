import { createState } from "@langgraph-js/pro";
import { McpState } from "./mcp";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { Annotation } from "@langchain/langgraph";

export const GraphState = createState(McpState, createReactAgentAnnotation()).build({
    graph_schema: Annotation<JSONGraphSchema>(),
});

export interface JSONGraphSchema {
    nodes: JSONNodeSchema[];
    edges: { source: string; target: string }[];
    start_node: string;
    // state_schema:
}

export interface ReActNodeSchema {
    name: string;
    type: "react_agent";
    prompt: string;
    llm: {
        modelName: string;
        temperature: number;
    };
    tools: {
        name: string;
    }[];
}
export interface SwarmNodeSchema {
    name: string;
    type: "swarm_agent";
    agents: string[];
    default_active_agent: string;
}

export type JSONNodeSchema = ReActNodeSchema | SwarmNodeSchema;
