import React from "react";
import { LangGraphClient, RenderMessage, ToolMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
interface MessageToolProps {
    message: ToolMessage & RenderMessage;
    client: LangGraphClient;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const MessageTool: React.FC<MessageToolProps> = ({ message, client, getMessageContent, formatTokens, isCollapsed, onToggleCollapse }) => {
    return (
        <div className="message tool">
            <div className="tool-message">
                <div className="tool-header" onClick={onToggleCollapse}>
                    <div className="tool-title">{message.name}</div>
                </div>
                {!isCollapsed && (
                    <div className="tool-content">
                        <div className="tool-input">{message.tool_input}</div>
                        <div className="tool-output">{getMessageContent(message.content)}</div>
                        {message.usage_metadata && <UsageMetadata usage_metadata={message.usage_metadata} spend_time={message.spend_time} />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageTool;
