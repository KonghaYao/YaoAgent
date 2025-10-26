import { z } from "zod";
import { BaseMessage } from "@langchain/core/messages";
import { withLangGraph } from "@langchain/langgraph/zod";
import { MessagesZodMeta } from "@langchain/langgraph";

/** zod schema for agent state */
export const AgentState = z.object({
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
});

// export { createAgent } from "langchain";
