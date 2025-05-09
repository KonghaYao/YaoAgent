import React from "react";
import { RenderMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { getMessageContent } from "@langgraph-js/sdk";
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
interface MessageAIProps {
    message: RenderMessage;
}

const MessageAI: React.FC<MessageAIProps> = ({ message }) => {
    return (
        <div className="message ai">
            <div className="message-content">
                <div className="message-text markdown-body">
                    <Markdown remarkPlugins={[remarkGfm]}>{getMessageContent(message.content)}</Markdown>
                </div>
                <UsageMetadata response_metadata={message.response_metadata as any} usage_metadata={message.usage_metadata||{}} spend_time={message.spend_time} />
            </div>
        </div>
    );
};

export default MessageAI;
