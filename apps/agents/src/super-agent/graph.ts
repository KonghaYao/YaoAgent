// Main graph
import { START, StateGraph, END, LangGraphRunnableConfig, interrupt } from "@langchain/langgraph";
import { createMCPNode } from "./tools/mcp.js";
import { GraphState, ConfigurationState } from "./state.js";
import { createLLM } from "../model/index.js";
import { SequentialThinkingTool, createFeTools } from "@langgraph-js/pro";
import { MemoryNode } from "../create-expert/short-term-memory.js";
import { getPrompt } from "../model/prompt-getter.js";
import { tool } from "@langchain/core/tools";
import { ToolRunnableConfig } from "@langchain/core/tools";
import z from "zod";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { crawler_tool, web_search_tool } from "../web-search/crawler.js";
import { createArtifactsTool } from "./tools/artifacts.js";

const ask_user_for_approve = tool(
    async (input, _config: ToolRunnableConfig) => {
        const data = interrupt(JSON.stringify(input));
        return [data, null];
    },
    {
        name: "ask_user_for_approve",
        description: "Request user review and approval for plans or content, wait for user feedback before proceeding",
        schema: z.object({
            title: z.string().describe("Title or subject of the content to be reviewed"),
        }),
        responseFormat: "content_and_artifact",
    }
);
const mainNode = createMCPNode<GraphState, LangGraphRunnableConfig<typeof ConfigurationState.State>>(
    {},
    async (state, config, mcpTools) => {
        const feTools = createFeTools(state.fe_tools);
        const executorPrompt = await getPrompt("executor.md", false);
        const artifactsPrompt = await getPrompt("artifacts-usage.md", false);

        const tools = [
            ...mcpTools,
            ...feTools,
            web_search_tool,
            ask_user_for_approve,
            crawler_tool,
            SequentialThinkingTool,
            createArtifactsTool,
        ];
        const llm = await createLLM(state, "main_model");

        const agent = createReactAgent({
            llm,
            tools,
            prompt: executorPrompt + "\n" + artifactsPrompt,
        });

        const response = await agent.invoke({
            messages: state.messages,
        });

        return {
            messages: response.messages,
        };
    }
);

export const builder = new StateGraph(GraphState, ConfigurationState)
    .addNode("main", mainNode)
    .addNode("memory", MemoryNode)
    .addEdge(START, "main")
    .addEdge("main", "memory")
    .addEdge("memory", END);

export const graph = builder.compile();
graph.name = "MemoryAgent";
