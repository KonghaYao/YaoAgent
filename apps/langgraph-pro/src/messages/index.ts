import { BaseMessage, HumanMessage } from "@langchain/core/messages";
/**
 * 获取消息的文本内容, 会对多个文本消息进行合并处理
 * @example
 * const text = getTextMessageContent(message);
 * console.log(text);
 */
export const getTextMessageContent = (message: BaseMessage): string => {
    return message.contentBlocks
        .filter((i) => i.type === "text")
        .map((i) => i.text)
        .join("\n");
};

/**
 * 获取最后一条人类发送的消息
 * @example
 * const lastHumanMessage = getLastHumanMessage(state.messages);
 * console.log(lastHumanMessage);
 */
export function getLastHumanMessage(messages: BaseMessage[]): HumanMessage | undefined {
    // 从后往前遍历消息列表
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        // 检查消息是否是 HumanMessage 的实例
        if (HumanMessage.isInstance(message)) {
            return message;
        }
    }
    // 如果没有找到 HumanMessage，则返回 undefined
    return undefined;
}
