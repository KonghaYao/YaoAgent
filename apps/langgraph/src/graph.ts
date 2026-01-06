import { entrypoint, MessagesZodMeta, Command, interrupt } from "@langchain/langgraph";
import { z } from "zod";
import { createEntrypointGraph } from "@langgraph-js/pure-graph";
// import { ChatOpenAI } from "@langgraph-js/pro";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, createAgent, humanInTheLoopMiddleware, HumanMessage, tool, ToolMessage } from "langchain";
import { create_artifacts } from "./create_artifacts";
import { withLangGraph } from "@langchain/langgraph/zod";

const State = z.object({
    task_store: z.record(z.string(), z.any()).default({}),
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
});
const hello_world = tool(
    (props) => {
        console.log(props);
        return "good";
    },
    {
        name: "hello_world",
        description: "hello_world",
        schema: z.object({}),
    }
);
const show_form = tool(
    (props) => {
        console.log(props);
        return "good";
    },
    {
        name: "show_form",
        description: "显示一个 rjsf schema 定义的表单",
        schema: z.object({
            schema: z.any().describe("@rjsf/core 所需要的 form schema， 对象格式，而非 json 字符串"),
        }),
    }
);
const interrupt_test = tool(
    (props) => {
        console.log(props);
        return "good";
    },
    {
        name: "interrupt_test",
        description: "测试中断",
        schema: z.object({
            message: z.string().describe("中断消息"),
        }),
    }
);

const sub_agent_tool = tool(
    async (props, config) => {
        const toolId = config?.toolCall?.id;
        const agent = createAgent({
            model: new ChatOpenAI({
                model: "gpt-4o-mini",
                tags: ["test"],
                metadata: {
                    parent_id: toolId,
                },
            }),
            systemPrompt: "你是一个智能助手",
        });

        const data = await agent.invoke({
            messages: [new HumanMessage(props.message)],
        });
        return new Command({
            update: {
                task_store: {
                    [toolId]: data,
                },
                messages: [
                    new ToolMessage({
                        content: "done",
                        tool_call_id: toolId,
                    }),
                ],
            },
        });
    },
    {
        name: "sub_agent_tool",
        schema: z.object({
            message: z.string().describe("子 agent 工具的输入"),
        }),
    }
);

const workflow = entrypoint("test-entrypoint", async (state: z.infer<typeof State>) => {
    // Access context data
    // const config = getConfig();
    // console.log('Context:', config.configurable);
    const agent = createAgent({
        model: new ChatOpenAI({
            model: "mimo-v2-flash",
        }),
        systemPrompt: "你是一个智能助手",
        tools: [show_form, interrupt_test, sub_agent_tool, create_artifacts, hello_world],
        middleware: [
            humanInTheLoopMiddleware({
                interruptOn: {
                    interrupt_test: true,
                },
            }),
        ],
        stateSchema: State,
    });
    const response = await agent.invoke(state);
    console.log(response);
    return response;
});

export const graph = createEntrypointGraph({
    stateSchema: State,
    graph: workflow,
});
