// Main graph
import { START, StateGraph, END } from "@langchain/langgraph";
import { SequentialThinkingTool } from "@langgraph-js/pro";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createMCPNode } from "./mcp";
import { ChatOpenAI } from "@langchain/openai";
import { GraphState, ReActNodeSchema } from "./state";
const createBaseNode = (node: ReActNodeSchema, tools: any[]) => {
    // const feTools = createFeTools(state.fe_tools);
    const executorPrompt = node.prompt;

    const llm = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });

    const agent = createReactAgent({
        llm,
        tools,
        prompt: executorPrompt,
    });

    return agent;
};

export const serverTools = {
    SequentialThinkingTool: () => SequentialThinkingTool,
};
const gen_node = createMCPNode<typeof GraphState.State>({}, async (state, config, mcpTools) => {
    const genGraph = new StateGraph(GraphState);
    const mcpToolNames = new Map(mcpTools.map((tool) => [tool.getName(), tool]));
    // 添加所有节点
    state.graph_schema.nodes.forEach((node) => {
        if (node.type === "react_agent") {
            const tools = node.tools
                .map((tool_config) => {
                    const toolName = tool_config.name as string;
                    /** @ts-ignore */
                    const tool = serverTools[toolName];
                    if (tool) {
                        return tool(state);
                    } else if (mcpToolNames.has(toolName)) {
                        return mcpToolNames.get(toolName);
                    }
                    return null;
                })
                .filter(Boolean);
            const agent = createBaseNode(node, [...mcpTools, ...tools]);
            genGraph.addNode(node.name, agent);
        }
    });

    // 添加所有边
    state.graph_schema?.edges?.forEach((edge) => {
        genGraph.addEdge(edge.source as any, edge.target as any);
    });

    // 添加起始和结束边
    genGraph.addEdge(START, state.graph_schema.start_node as any);

    const res = await genGraph.compile().invoke({
        messages: state.messages,
    });
    return {
        messages: res.messages,
    };
});

export const graph = new StateGraph(GraphState).addNode("main", gen_node).addEdge(START, "main").addEdge("main", END).compile();
graph.name = "agent";
