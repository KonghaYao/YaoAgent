// Main graph
import { START, StateGraph, END, LangGraphRunnableConfig, interrupt } from "@langchain/langgraph";
import { createMCPNode } from "./tools/mcp.js";
import { initializeTools } from "./tools/index.js";
import { GraphState, ConfigurationState } from "./state.js";
import { createLLM } from "../model/index.js";
import { SystemMessage } from "@langchain/core/messages";
import { MemoryPrompt } from "./tools/memory.js";
import { createExpert } from "../create-expert/index.js";
import { SequentialThinkingTool } from "../pro/tools/sequential-thinking.js";
import { MemoryNode } from "../create-expert/short-term-memory.js";
import { getPrompt } from "../model/prompt-getter.js";
import { createFeTools } from "../pro/feTools.js";
import { tool } from "@langchain/core/tools";
import { ToolRunnableConfig } from "@langchain/core/tools";
import z from "zod";
const ask_user_for_approve = tool(
    async (input, config: ToolRunnableConfig) => {
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
    {
        // npm: {
        //     transport: "sse",
        //     url: "http://0.0.0.0:6798/npm_bot/sse",
        //     useNodeEventSource: true,
        // },
        // "zhipu-web-search-sse": {
        //     transport: "sse",
        //     url: "https://open.bigmodel.cn/api/mcp/web_search/sse?Authorization=" + process.env.ZHIPU_API_KEY,
        // },
    },
    async (state, config, mcpTools) => {
        const feTools = createFeTools(state.fe_tools);
        const stylePrompt = await getPrompt("style.md");
        const plannerPrompt = await getPrompt("planner.md");
        const executorPrompt = await getPrompt("executor.md");
        const summaryPrompt = await getPrompt("summary.md");
        const normalTools = initializeTools(state, config);

        const tools = [...normalTools, ...mcpTools, ...feTools, ask_user_for_approve];
        const llm = await createLLM(state, "main_model");

        const agent = createExpert({
            plannerConfig: {
                llm,
                tools: [...tools, SequentialThinkingTool],
                stateModifier: new SystemMessage(`${plannerPrompt}  

${stylePrompt}

${MemoryPrompt}`),
            },
            executorConfig: {
                llm,
                tools,
                stateModifier: new SystemMessage(`${executorPrompt}

${stylePrompt}

${MemoryPrompt}`),
            },
            summaryConfig: {
                llm,
                tools,
                stateModifier: new SystemMessage(`${summaryPrompt}

${stylePrompt}
`),
            },
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
