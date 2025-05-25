import { BaseMessage, HumanMessage, isHumanMessage, MessageContentText } from "@langchain/core/messages";
export const getTextMessageContent = (message: BaseMessage): string => {
    if (typeof message.content === "string") {
        return message.content;
    } else {
        return message.content
            .filter((i) => i.type === "text")
            .map((i) => (i as MessageContentText).text)
            .join("\n");
    }
};

export function getLastHumanMessage(messages: BaseMessage[]): HumanMessage | undefined {
    // 从后往前遍历消息列表
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        // 检查消息是否是 HumanMessage 的实例
        if (isHumanMessage(message)) {
            return message;
        }
    }
    // 如果没有找到 HumanMessage，则返回 undefined
    return undefined;
}
