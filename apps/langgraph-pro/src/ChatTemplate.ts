import { SystemMessage, HumanMessage, AIMessageChunk, ToolMessage, type MessageUnion, type BaseMessageLike } from "@langchain/core/messages";

export interface Template {
    role: string;
    content: string | any[];
    tool_calls: any[];
    tool_call_id: string;
    invalid_tool_calls: any[];
}

export const createChatTemplate = (template: Template[]): BaseMessageLike[] => {
    return template.map((i) => {
        switch (i.role) {
            case "system":
                /** @ts-ignore */
                return new SystemMessage(i.content);
            case "human":
                return new HumanMessage(i);
            case "ai":
                return new AIMessageChunk(i);
            case "tool":
                return new ToolMessage(i);
            default:
                return new HumanMessage(i.content as string);
        }
    });
};
export const messagesToTemplate = (messages: MessageUnion[]): Template[] => {
    return messages.map((i: any) => {
        return {
            role: i.getType(),
            content: i.content,
            tool_calls: i.tool_calls,
            tool_call_id: i.tool_call_id,
            invalid_tool_calls: i.invalid_tool_calls,
        };
    });
};
