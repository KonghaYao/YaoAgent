import React from "react";
import { RenderMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
interface MessageAIProps {
    message: RenderMessage;
    getMessageContent: (content: any) => string;
}

const MessageAI: React.FC<MessageAIProps> = ({ message, getMessageContent }) => {
    return (
        <div className="message ai">
            <div className="message-content">
                <div className="message-text">{getMessageContent(message.content)}</div>
                {message.usage_metadata && <UsageMetadata usage_metadata={message.usage_metadata} spend_time={message.spend_time} />}
            </div>
        </div>
    );
};

export default MessageAI;
