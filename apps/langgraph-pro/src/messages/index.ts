import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { AIMessage, ContentBlock, ToolMessage } from "@langchain/core/messages";
import { createMessagesQuery, queryLastMessage } from "./query.js";
export * from "./query.js";
/**
 * 获取最后一条人类发送的消息
 * @example
 * const lastHumanMessage = getLastHumanMessage(state.messages);
 * console.log(lastHumanMessage);
 */
export function getLastHumanMessage(messages: BaseMessage[]): HumanMessage | undefined {
    // 如果没有找到 HumanMessage，则返回 undefined
    return createMessagesQuery().isHuman().build().messages(messages).last() as HumanMessage | undefined;
}

export const getThreadId = (context: any) => {
    return context?.configurable?.thread_id as string;
};

export const getToolCallId = (context: any) => {
    return context?.toolCall?.id as string;
};

/**
 *  创建一对 toolCall 数据
 * @example
 * ```typescript
 * const [aiMessage, toolMessage] = createToolCall("toolName", { input: "input" }, "this is tool outputs");
 * ```
 */
export const createToolCall = (toolName: string, input: Record<string, any>, output?: string | (ContentBlock | ContentBlock.Text)[]) => {
    const aiId = crypto.randomUUID();
    const toolCallId = crypto.randomUUID();
    return [
        new AIMessage({
            content: ``,
            id: aiId,
            tool_calls: [
                {
                    id: toolCallId,
                    name: toolName,
                    args: input,
                    type: "tool_call",
                },
            ],
        }),
        new ToolMessage({
            id: crypto.randomUUID(),
            content: output,
            tool_call_id: toolCallId,
            name: toolName,
        }),
    ] as const;
};
