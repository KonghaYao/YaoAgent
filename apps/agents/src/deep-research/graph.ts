import { createReactAgent, ToolNode } from "@langchain/langgraph/prebuilt";
import { Plan, DeepResearchState } from "./state.js";
import { apply_prompt_template } from "./utils.js";
import { createSwarm } from "@langchain/langgraph-swarm";
import { createHandoffTool } from "../pro/swarm/handoff.js";
import { ChatOpenAI } from "@langchain/openai";
import { SequentialThinkingTool } from "../pro/tools/sequential-thinking.js";
import {
    Command,
    END,
    getCurrentTaskInput,
    interrupt,
    MessagesAnnotation,
    START,
    StateGraph,
} from "@langchain/langgraph";
import { DynamicStructuredTool, DynamicTool, Tool, tool, ToolRunnableConfig } from "@langchain/core/tools";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { keepAllStateInHandOff } from "../pro/swarm/keepState.js";
import { TavilySearch } from "@langchain/tavily";
import { web_search_tool } from "../web-search/searchMock.js";
import { getTextMessageContent } from "src/pro/utils.js";
import z from "zod";
const tavilyTool = new TavilySearch({
    maxResults: 5,
});

const llm = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 0,
});
const singleLLM = new ChatOpenAI({
    modelName: "gpt-4.1-mini",
    temperature: 0,
    configuration: {
        /** @ts-ignore */
        parallel_tool_calls: true,
    },
});
const coordinator_agent = createReactAgent({
    name: "coordinator",
    llm,
    tools: [createHandoffTool({ agentName: "planner", description: "制定计划", updateState: keepAllStateInHandOff })],
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

const planner_agent = createReactAgent({
    name: "planner",
    llm,
    tools: [
        // SequentialThinkingTool,
        ask_user_for_approve,
        update_plan,
        createHandoffTool({
            agentName: "research_dispatcher",
            description: "进行研究",
            updateState: keepAllStateInHandOff,
        }),
        createHandoffTool({
            agentName: "reporter",
            description: "进行总结",
            updateState: keepAllStateInHandOff,
        }),
    ],
    prompt: async (state) => {
        const data = await apply_prompt_template("deep_research_planner.md", state as any);
        return [new SystemMessage(data), ...state.messages];
    },
    stateSchema: DeepResearchState,
});
const research_dispatcher = new StateGraph(DeepResearchState)
    .addNode("sub_research", async (state) => {
        const step = state.current_plan!.steps[state.plan_iterations];
        const prompt = await apply_prompt_template("deep_research_researcher.md", state);
        const researcher_agent = createReactAgent({
            name: "sub_researcher",
            llm,
            tools: [
                web_search_tool,
                // tavilyTool,
            ],
            prompt,
            stateSchema: DeepResearchState,
        });
        const { messages } = await researcher_agent.invoke({
            messages: [
                new HumanMessage(
                    "下面是你的任务主题\n" +
                        step.title +
                        "\n\n下面是你要完成的目标\n" +
                        step.description +
                        "\n\n请你开始工作"
                ),
            ],
            current_plan: state.current_plan,
            plan_iterations: state.plan_iterations,
        });
        step.execution_res = getTextMessageContent(messages[messages.length - 1]);
        return {
            messages: [...state.messages, ...messages],
            plan_iterations: state.plan_iterations + 1,
            current_plan: state.current_plan,
        };
    })
    .addEdge(START, "sub_research")
    .addNode("goto_reporter", async (_state) => {
        const state = getCurrentTaskInput() as (typeof DeepResearchState)["State"];
        return new Command({
            goto: "planner",
            graph: Command.PARENT,
            update: { messages: [...state.messages, ..._state.messages], current_plan: state.current_plan },
        });
    })
    .addEdge("goto_reporter", END)
    .addConditionalEdges(START, (state) => {
        return state.current_plan?.steps[state.plan_iterations] ? "sub_research" : "goto_reporter";
    })
    .addConditionalEdges("sub_research", (state) => {
        return state.current_plan?.steps[state.plan_iterations] ? "sub_research" : "goto_reporter";
    })
    .compile({
        name: "research_dispatcher",
    });

const reporter_agent = createReactAgent({
    name: "reporter",
    llm,
    tools: [],
    /** @ts-ignore */
    prompt: async (state: typeof DeepResearchState.State) => {
        const data = await apply_prompt_template("deep_research_reporter.md", state as any);
        return [
            new SystemMessage(data),
            new HumanMessage("请你根据下面内容生成总结"),
            new AIMessage({
                content: JSON.stringify(state.current_plan),
            }),
        ];
    },
    stateSchema: DeepResearchState,
});

const swarm = createSwarm({
    agents: await Promise.all([coordinator_agent, planner_agent, research_dispatcher as any, reporter_agent]),
    defaultActiveAgent: "coordinator",
    stateSchema: DeepResearchState,
});

export const deep_research_graph = swarm.compile();
deep_research_graph.name = "DeepResearch";
