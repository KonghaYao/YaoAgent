import React from "react";
import { RenderMessage } from "@langgraph-js/sdk";

interface MessageAIProps {
    message: RenderMessage;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
}

const MessageAI: React.FC<MessageAIProps> = ({ message, getMessageContent, formatTokens }) => {
    return (
        <div className="message ai">
            <div className="message-content">
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
            </div>
        </div>
    );
};

export default MessageAI;
