import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { Plan, DeepResearchState } from "./state.js";
import { apply_prompt_template } from "./utils.js";
import { createHandoffTool, createSwarm } from "@langchain/langgraph-swarm";
import { ChatOpenAI } from "@langchain/openai";
import { SequentialThinkingTool } from "../super-agent/tools/sequential-thinking.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { Command, END, START, StateGraph } from "@langchain/langgraph";
import { tool, ToolRunnableConfig } from "@langchain/core/tools";
import { z } from "zod";
import { SystemMessage, ToolMessage } from "@langchain/core/messages";

const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
});
// update_metadata_for_this_chat
const coordinator_agent = createReactAgent({
    name: "coordinator",
    llm,
    tools: [createHandoffTool({ agentName: "planner", description: "制定计划" })],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_coordinator.md", state as any);
        return [new SystemMessage(data)];
    },
    stateSchema: DeepResearchState,
});

const update_plan = tool(
    async (input: { plan: Plan }, config: ToolRunnableConfig) => {
        return new Command({
            update: {
                plan: input.plan,
                messages: [
                    new ToolMessage({
                        content: "Successfully looked up user information",
                        tool_call_id: config.toolCall!.id!,
                    }),
                ],
            },
        });
    },
    {
        name: "update_plan",
        description: "Update plan for this chat",
        schema: Plan,
        responseFormat: "content_and_artifact",
    }
);

const planner_agent = createReactAgent({
    name: "planner",
    llm,
    tools: [
        SequentialThinkingTool,
        update_plan,
        createHandoffTool({ agentName: "researcher", description: "进行研究" }),
        createHandoffTool({ agentName: "reporter", description: "进行总结, 无法并发调用" }),
    ],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_planner.md", state as any);
        return [new SystemMessage(data)];
    },
    stateSchema: DeepResearchState,
});

function create_researcher_graph() {
    const builder = new StateGraph(DeepResearchState)
        .addNode("research", async (state) => {
            const agent = researcher_agent;
            const { messages } = await agent.invoke(state);
            return {
                messages,
                plan_iterations: state.plan_iterations + 1,
            };
        })
        .addEdge(START, "research")
        .addConditionalEdges("research", (state) => {
            if (state.plan_iterations < (state.current_plan?.steps.length || 0)) {
                return "research";
            }
            return END;
        });
    return builder.compile({
        name: "researcher",
    });
}
const MCPTools = new MultiServerMCPClient({
    throwOnLoadError: false,
    prefixToolNameWithServerName: false,
    additionalToolNamePrefix: "",
    mcpServers: {
        "zhipu-web-search-sse": {
            transport: "sse",
            url: "https://open.bigmodel.cn/api/mcp/web_search/sse?Authorization=" + process.env.ZHIPU_API_KEY,
        },
    },
});
const tools = await MCPTools.getTools();
const researcher_agent = createReactAgent({
    name: "researcher",
    llm,
    tools: [...tools, createHandoffTool({ agentName: "planner", description: "返回计划" })],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_researcher.md", state as any);
        return [new SystemMessage(data)];
    },
    stateSchema: DeepResearchState,
});

const reporter_agent = createReactAgent({
    name: "reporter",
    llm,
    tools: [],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_reporter.md", state as any);
        return [new SystemMessage(data)];
    },
    stateSchema: DeepResearchState,
});

const swarm = createSwarm({
    agents: await Promise.all([coordinator_agent, planner_agent, create_researcher_graph() as any, reporter_agent]),
    defaultActiveAgent: "coordinator",
    stateSchema: DeepResearchState,
});

const deep_research = swarm.compile();
const builder = new StateGraph(DeepResearchState)
    .addNode("deep_research", deep_research)
    .addEdge(START, "deep_research")
    .addEdge("deep_research", END);
export const deep_research_graph = builder.compile();
deep_research_graph.name = "DeepResearch";
