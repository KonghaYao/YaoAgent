import React, { JSX, useState } from "react";
import { LangGraphClient, RenderMessage, ToolMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { useChat } from "../context/ChatContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
                            <Previewer className="tool-input" content={message.tool_input || ""} />
                            <Previewer className="tool-output" content={getMessageContent(message.content)} />
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

const Previewer = ({ content, className }: { content: string; className: string }) => {
    const validJSON = () => {
        try {
            JSON.parse(content);
            return true;
        } catch (e) {
            return false;
        }
    };
    const isJSON = content.startsWith("{") && content.endsWith("}") && validJSON();
    const isMarkdown = content.includes("#") || content.includes("```") || content.includes("*");
    const [jsonMode, setJsonMode] = useState(false);
    const [markdownMode, setMarkdownMode] = useState(false);

    return (
        <div className={className}>
            <div className="preview-controls">
                {isJSON && <button onClick={() => setJsonMode(!jsonMode)}>json</button>}
                {isMarkdown && <button onClick={() => setMarkdownMode(!markdownMode)}>markdown</button>}
            </div>

            {jsonMode && isJSON ? (
                <pre className="params-body">{JSON.stringify(JSON.parse(content), null, 2)}</pre>
            ) : markdownMode && isMarkdown ? (
                <div className="params-body markdown-body">
                    <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                </div>
            ) : (
                <pre className="params-body">{content}</pre>
            )}
        </div>
    );
};
export default MessageTool;
