import { BaseMessage, MessageContentText } from "@langchain/core/messages";
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
