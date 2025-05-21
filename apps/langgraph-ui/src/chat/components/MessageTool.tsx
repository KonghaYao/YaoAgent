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
            {message.name === "ask_user" && !message.additional_kwargs?.done && (
                <div>
                    <div>询问 {message.tool_input}</div>
                    <input
                        type="text"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                client.doneFEToolWaiting(message.id!, (e.target as any).value);
                            }
                        }}
                    />
                </div>
            )}
            <div className="tool-message">
                <div className="tool-header" onClick={onToggleCollapse}>
                    <div className="tool-title">
                        {message.node_name} | {message.name}
                    </div>
                </div>

                {!isCollapsed && (
                    <div className="tool-content">
                        <div className="tool-input">{message.tool_input}</div>
                        <div className="tool-output">{getMessageContent(message.content)}</div>
                        <UsageMetadata response_metadata={message.response_metadata as any} usage_metadata={message.usage_metadata || {}} spend_time={message.spend_time} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessageTool;
