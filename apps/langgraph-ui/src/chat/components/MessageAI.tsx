import React from "react";
import { RenderMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { getMessageContent } from "@langgraph-js/sdk";
interface MessageAIProps {
    message: RenderMessage;
}

const MessageAI: React.FC<MessageAIProps> = ({ message }) => {
    return (
        <div className="message ai">
            <div className="message-content">
                <div className="message-text">{getMessageContent(message.content)}</div>
                <UsageMetadata  response_metadata={message.response_metadata as any} usage_metadata={message.usage_metadata||{}} spend_time={message.spend_time} />
            </div>
        </div>
    );
};

export default MessageAI;
