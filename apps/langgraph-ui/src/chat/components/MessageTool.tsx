import React from "react";
import { LangGraphClient, RenderMessage } from "@langgraph-js/sdk";

interface MessageToolProps {
    message: RenderMessage;
    client: LangGraphClient;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const MessageTool: React.FC<MessageToolProps> = ({ message, client, getMessageContent, formatTokens, isCollapsed, onToggleCollapse }) => {
    return (
        <div className="message tool">
            <div className="message-content">
                <div className="message-header">
                    <span className="tool-name">{(message as any).name}</span>
                    <button className="collapse-button" onClick={onToggleCollapse}>
                        {isCollapsed ? "展开" : "收起"}
                    </button>
                </div>
                {!isCollapsed && (
                    <>
                        <div className="message-text">{getMessageContent(message.content)}</div>
                        {message.usage_metadata && (
                            <div className="message-meta">
                                <span className="message-time">{message.spend_time ? `${(message.spend_time / 1000).toFixed(2)}s` : ""}</span>
                                <div className="token-info">
                                    <span className="token-item">
                                        <span className="token-emoji">📥</span>
                                        {formatTokens(message.usage_metadata.input_tokens)}
                                    </span>
                                    <span className="token-item">
                                        <span className="token-emoji">📤</span>
                                        {formatTokens(message.usage_metadata.output_tokens)}
                                    </span>
                                    <span className="token-item">
                                        <span className="token-emoji">📊</span>
                                        {formatTokens(message.usage_metadata.total_tokens)}
                                    </span>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default MessageTool;
