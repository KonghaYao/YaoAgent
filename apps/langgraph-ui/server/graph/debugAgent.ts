import { entrypoint } from "@langchain/langgraph";
import { z } from "zod";
import { createStateEntrypoint } from "@langgraph-js/pure-graph";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, humanInTheLoopMiddleware } from "langchain";
import { AgentState } from "@langgraph-js/pro";

const State = AgentState.merge(
    z.object({
        model_name: z.string().default("gpt-4o-mini"),
        api_key: z.string().optional(),
        api_host: z.string().optional(),
    })
);

const workflow = async (state: z.infer<typeof State>) => {
    const model = new ChatOpenAI({
        model: state.model_name,
        useResponsesApi: false,
        apiKey: state.api_key,
        configuration: {
            baseURL: state.api_host,
        },
    });
    const agent = createAgent({
        model,
        systemPrompt: "你是一个消息检查助手，能够使用工具检查用户和 AI 之间的对话",
        tools: [],
        middleware: [
            humanInTheLoopMiddleware({
                interruptOn: {},
            }),
        ],
        stateSchema: State,
    });
    return agent.invoke(state);
};

export const graph = createStateEntrypoint(
    {
        name: "debug-agent",
        stateSchema: State,
    },
    workflow
);
