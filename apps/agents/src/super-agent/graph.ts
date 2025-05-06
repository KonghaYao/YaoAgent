// Main graph
import { START, StateGraph, END, LangGraphRunnableConfig } from "@langchain/langgraph";
import { createMCPNode } from "./tools/mcp.js";
import { initializeTools } from "./tools/index.js";
import { GraphState, ConfigurationState } from "./state.js";
import { createLLM } from "../model/index.js";
import { AIMessage, BaseMessage, SystemMessage } from "@langchain/core/messages";
import { MemoryPrompt } from "./tools/memory.js";
import { createExpert } from "src/create-expert/index.js";
import { SequentialThinkingTool } from "./tools/sequential-thinking.js";
import { MemoryNode } from "src/create-expert/short-term-memory.js";
import { getPrompt } from "src/model/prompt-getter.js";
import { createFeTools } from "src/model/fe_tools.js";
const mainNode = createMCPNode<GraphState, LangGraphRunnableConfig<ConfigurationState>>(
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
        console.log(new AIMessage(""));
        const feTools = createFeTools(state.fe_tools);
        const stylePrompt = await getPrompt("./src/prompt/style.md");
        const plannerPrompt = await getPrompt("./src/prompt/planner.md");
        const executorPrompt = await getPrompt("./src/prompt/executor.md");
        const summaryPrompt = await getPrompt("./src/prompt/summary.md");
        const normalTools = initializeTools(state, config);

        const tools = [...normalTools, ...mcpTools, ...feTools];
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
