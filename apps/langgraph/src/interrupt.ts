import { StateGraph, START, END, MessagesZodMeta, MemorySaver, interrupt } from "@langchain/langgraph";
import { z } from "zod";
import { withLangGraph } from "@langchain/langgraph/zod";
import { BaseMessage, createAgent, humanInTheLoopMiddleware, HumanMessage, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";

// 定义状态类型
export const InterruptGraphState = z.object({
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
    user_input: z.string().optional(),
});

// 创建带有中断功能的图 (使用 interrupt() 函数)
function createInterruptGraph() {
    const workflow = new StateGraph(InterruptGraphState)
        .addNode("agent", async (state) => {
            interrupt("djifjidf");
            return;
        })

        .addEdge(START, "agent")
        .addEdge("agent", END);

    return workflow.compile({ checkpointer: new MemorySaver() });
}

const graph = createInterruptGraph();

// Run the graph until the interrupt is hit.
const result = await graph.stream(
    {
        messages: [new HumanMessage("use test_tool")],
    },
    {
        // subgraphs: true,
        streamMode: ["messages", "values"],
        configurable: { thread_id: "some_id" },
    }
);
for await (const chunk of result) {
    console.log(chunk);
}
