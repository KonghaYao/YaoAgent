import { RenderMessage } from "../LangGraphClient.js";

/** 获取 AIMessage 中的 Thinking 文本 */
export const getThinkingContent = (message: RenderMessage) => {
    /** @ts-ignore 解决 langgraph sdk 没有类型的问题 */
    return message.additional_kwargs?.reasoning_content || (Array.isArray(message.content) && message.content.find((i) => i.type === "thinking")?.thinking);
};

/** 获取 AIMessage 中的纯文本 */
export const getTextContent = (message: RenderMessage) => {
    return typeof message.content === "string"
        ? message.content
        : message.content
              ?.filter((i) => {
                  return i.type === "text";
              })
              .map((i) => i.text)
              .join("");
};
