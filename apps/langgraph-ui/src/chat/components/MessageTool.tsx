import React, { JSX } from "react";
import { LangGraphClient, RenderMessage, ToolMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { useChat } from "../context/ChatContext";
interface MessageToolProps {
    message: ToolMessage & RenderMessage;
    client: LangGraphClient;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const MessageTool: React.FC<MessageToolProps> = ({ message, client, getMessageContent, formatTokens, isCollapsed, onToggleCollapse }) => {
    const { getToolUIRender } = useChat();
    const render = getToolUIRender(message.name!);
    return (
        <div className="message tool">
            {render ? (
                (render(message) as JSX.Element)
            ) : (
                <div className="tool-message">
                    <div className="tool-header" onClick={onToggleCollapse}>
                        <div className="tool-title" onClick={() => console.log(message)}>
                            {message.node_name} | {message.name}
                        </div>
                    </div>

                    {!isCollapsed && (
                        <div className="tool-content">
                            <div className="tool-input">{message.tool_input}</div>
                            <div className="tool-output">{getMessageContent(message.content)}</div>
                            <UsageMetadata
                                response_metadata={message.response_metadata as any}
                                usage_metadata={message.usage_metadata || {}}
                                spend_time={message.spend_time}
                                id={message.id}
                                tool_call_id={message.tool_call_id}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MessageTool;
