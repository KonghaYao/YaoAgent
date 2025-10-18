import React from "react";
import { RenderMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { getMessageContent } from "@langgraph-js/sdk";
import { Response } from "@/components/ai-elements/response";

interface MessageAIProps {
    message: RenderMessage;
}

const MessageAI: React.FC<MessageAIProps> = ({ message }) => {
    return (
        <div className="flex flex-col w-[80%] bg-white rounded-2xl px-5 py-4">
            <div className="text-xs font-medium text-gray-500 mb-3">{message.name}</div>
            <div className="markdown-body max-w-none">
                <Response>{getMessageContent(message.content)}</Response>
            </div>
            <UsageMetadata response_metadata={message.response_metadata as any} usage_metadata={message.usage_metadata || {}} spend_time={message.spend_time} id={message.id} />
        </div>
    );
};

export default MessageAI;
