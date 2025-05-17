import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { Plan, DeepResearchState } from "./state.js";
import { apply_prompt_template } from "./utils.js";
import { createHandoffTool, createSwarm } from "@langchain/langgraph-swarm";
import { ChatOpenAI } from "@langchain/openai";
import { SequentialThinkingTool } from "src/super-agent/tools/sequential-thinking.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { END, START, StateGraph } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// update_metadata_for_this_chat

async function coordinator_agent(state: typeof DeepResearchState.State) {
    const messages = await apply_prompt_template("deep_research_coordinator.md", state);
    const llm = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });

    return createReactAgent({
        name: "coordinator",
        llm,
        tools: [createHandoffTool({ agentName: "planner", description: "制定计划" })],
        prompt: messages,
    });
}
async function planner_agent(state: typeof DeepResearchState.State) {
    const messages = await apply_prompt_template("deep_research_planner.md", state);

    const llm = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });
    const update_plan = tool(
        async (input: { plan: Plan }) => {
            state.current_plan = input.plan;
            return "计划已更新";
        },
        {
            name: "update_plan",
            description: "Update plan for this chat",
            schema: z.object({
                plan: Plan,
            }),
        }
    );
    return createReactAgent({
        name: "planner",
        llm,
        tools: [
            SequentialThinkingTool,
            update_plan,
            createHandoffTool({ agentName: "researcher", description: "进行研究" }),
            createHandoffTool({ agentName: "reporter", description: "进行总结, 无法并发调用" }),
        ],
        prompt: messages,
    });
}

function create_researcher_graph() {
    const builder = new StateGraph(DeepResearchState)
        .addNode("research", async (state) => {
            const agent = await researcher_agent(state);
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

async function researcher_agent(state: typeof DeepResearchState.State) {
    const messages = await apply_prompt_template("deep_research_researcher.md", state);
    const llm = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });
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
    return createReactAgent({
        name: "researcher",
        llm,
        tools: [...tools, createHandoffTool({ agentName: "planner", description: "返回计划" })],
        prompt: messages,
    });
}
async function reporter_agent(state: typeof DeepResearchState.State) {
    const messages = await apply_prompt_template("deep_research_reporter.md", state);
    const llm = new ChatOpenAI({
        modelName: "gpt-4o-mini",
        temperature: 0,
    });
    return createReactAgent({
        name: "reporter",
        llm,
        tools: [],
        prompt: messages,
    });
}

export const createDeepResearchNode = async (state: typeof DeepResearchState.State) => {
    const swarm = createSwarm({
        agents: await Promise.all([
            coordinator_agent(state),
            planner_agent(state),
            create_researcher_graph() as any,
            reporter_agent(state),
        ]),
        defaultActiveAgent: "coordinator",
        stateSchema: DeepResearchState,
    });

    const agent = swarm.compile();
    const { messages } = await agent.invoke(state);
    return {
        messages,
    };
};
const builder = new StateGraph(DeepResearchState)
    .addNode("deep_research", createDeepResearchNode)
    .addEdge(START, "deep_research")
    .addEdge("deep_research", END);
export const deep_research_graph = builder.compile();
deep_research_graph.name = "DeepResearch";
