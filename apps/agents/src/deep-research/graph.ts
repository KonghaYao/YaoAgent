import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { Plan, DeepResearchState } from "./state.js";
import { apply_prompt_template } from "./utils.js";
import { createHandoffTool, createSwarm } from "@langchain/langgraph-swarm";
import { ChatOpenAI } from "@langchain/openai";
import { SequentialThinkingTool } from "../pro/tools/sequential-thinking.js";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { Command, END, START, StateGraph } from "@langchain/langgraph";
import { tool, ToolRunnableConfig } from "@langchain/core/tools";
import { SystemMessage, ToolMessage } from "@langchain/core/messages";
import { createLangSearchTool } from "src/web-search/langSearch.js";

const llm = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temperature: 0,
});
const coordinator_agent = createReactAgent({
    name: "coordinator",
    llm,
    tools: [createHandoffTool({ agentName: "planner", description: "制定计划" })],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_coordinator.md", state as any);
        return [new SystemMessage(data), ...state.messages];
    },
    stateSchema: DeepResearchState,
});

const update_plan = tool(
    async (input, config: ToolRunnableConfig) => {
        return new Command<typeof DeepResearchState.State>({
            update: {
                current_plan: input,
                messages: [
                    new ToolMessage({
                        content: "完成计划更新",
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
    }
);

const planner_agent = createReactAgent({
    name: "planner",
    llm,
    tools: [
        // SequentialThinkingTool,
        update_plan,
        createHandoffTool({ agentName: "researcher", description: "进行研究" }),
        createHandoffTool({ agentName: "reporter", description: "进行总结" }),
    ],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_planner.md", state as any);
        return [new SystemMessage(data), ...state.messages];
    },
    stateSchema: DeepResearchState,
});

function create_researcher_graph() {
    const builder = new StateGraph(DeepResearchState)
        .addNode("sub_research", async (state) => {
            state.current_plan!.steps[state.plan_iterations];
            const prompt = await apply_prompt_template("deep_research_researcher.md", state as any);
            const researcher_agent = createReactAgent({
                name: "sub_researcher",
                llm,
                tools: [
                    ...createLangSearchTool(process.env.LANGSEARCH_API_KEY!),
                    createHandoffTool({ agentName: "planner", description: "返回计划" }),
                ],
                prompt,
                stateSchema: DeepResearchState,
            });
            const { messages } = await researcher_agent.invoke(state);
            const newSteps = [...state.current_plan!.steps];
            newSteps[state.plan_iterations] = {
                ...newSteps[state.plan_iterations],
                execution_res: JSON.stringify(messages),
            };
            const updatedPlan = {
                ...state.current_plan,
                steps: newSteps,
            };
            return {
                messages,
                plan_iterations: state.plan_iterations + 1,
                current_plan: updatedPlan,
            };
        })
        .addEdge(START, "sub_research")
        .addConditionalEdges(START, (state) => {
            return state.current_plan?.steps[state.plan_iterations] ? "sub_research" : END;
        })
        .addConditionalEdges("sub_research", (state) => {
            return state.current_plan?.steps[state.plan_iterations] ? "sub_research" : END;
        });
    return builder.compile({
        name: "researcher",
    });
}

const reporter_agent = createReactAgent({
    name: "reporter",
    llm,
    tools: [],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_reporter.md", state as any);
        return [new SystemMessage(data), ...state.messages];
    },
    stateSchema: DeepResearchState,
});

const swarm = createSwarm({
    agents: await Promise.all([coordinator_agent, planner_agent, create_researcher_graph() as any, reporter_agent]),
    defaultActiveAgent: "coordinator",
    stateSchema: DeepResearchState,
});

export const deep_research_graph = swarm.compile();
deep_research_graph.name = "DeepResearch";
