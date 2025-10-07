import React, { JSX, useState } from "react";
import { LangGraphClient, RenderMessage, ToolMessage } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { useChat } from "../context/ChatContext";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Highlight, themes } from "prism-react-renderer";
import { MessagesBox } from "./MessageBox";

const TOOL_COLORS = ["bg-white", "bg-white", "bg-white", "bg-white", "bg-white", "bg-white", "bg-white"];

interface MessageToolProps {
    message: ToolMessage & RenderMessage;
    client: LangGraphClient;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const getToolColorClass = (tool_name: string) => {
    let hash = 0;
    for (let i = 0; i < tool_name.length; i++) {
        hash = tool_name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % TOOL_COLORS.length);
    return TOOL_COLORS[index];
};

const MessageTool: React.FC<MessageToolProps> = ({ message, client, getMessageContent, formatTokens, isCollapsed, onToggleCollapse }) => {
    const { getToolUIRender } = useChat();
    const render = getToolUIRender(message.name!);
    const bgColorClass = getToolColorClass(message.name!);
    return (
        <div className="flex flex-col w-full">
            {render ? (
                (render(message) as JSX.Element)
            ) : (
                <div className={`flex flex-col w-full ${bgColorClass} rounded-2xl overflow-hidden`}>
                    <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-black/5 transition-colors" onClick={onToggleCollapse}>
                        <div className="text-xs font-medium text-gray-600" onClick={() => console.log(message)}>
                            {message.node_name} | {message.name}
                        </div>
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col gap-4 px-5 pb-4">
                            <Previewer content={message.tool_input || ""} />
                            <Previewer content={getMessageContent(message.content)} />
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
            {message.sub_agent_messages && (
                <div className="flex flex-col pl-6 py-3 ml-4 border-l-2 border-gray-200">
                    <MessagesBox renderMessages={message.sub_agent_messages} collapsedTools={[]} toggleToolCollapse={(id) => {}} client={client} />
                </div>
            )}
        </div>
    );
};

const Previewer = ({ content }: { content: string }) => {
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
    const [jsonMode, setJsonMode] = useState(isJSON);
    const [markdownMode, setMarkdownMode] = useState(false);
    const copyToClipboard = () => {
        navigator.clipboard.writeText(content);
    };
    return (
        <div className={`flex flex-col`}>
            <div className="flex gap-2 mb-2">
                <button onClick={copyToClipboard} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white/60 rounded-lg hover:bg-white transition-colors">
                    copy
                </button>
                {isJSON && (
                    <button onClick={() => setJsonMode(!jsonMode)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white/60 rounded-lg hover:bg-white transition-colors">
                        json
                    </button>
                )}
                {isMarkdown && (
                    <button onClick={() => setMarkdownMode(!markdownMode)} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white/60 rounded-lg hover:bg-white transition-colors">
                        markdown
                    </button>
                )}
            </div>

            <div className="flex flex-col max-h-[300px] overflow-auto bg-white/40 rounded-xl p-3 w-full text-xs font-mono whitespace-pre-wrap">
                {jsonMode && isJSON ? (
                    <Highlight code={JSON.stringify(JSON.parse(content), null, 2)} language="json" theme={themes.oneLight}>
                        {({ className, style, tokens, getLineProps, getTokenProps }) => (
                            <pre style={style}>
                                {tokens.map((line, i) => (
                                    <div key={i} {...getLineProps({ line })}>
                                        {line.map((token, key) => (
                                            <span key={key} {...getTokenProps({ token })} />
                                        ))}
                                    </div>
                                ))}
                            </pre>
                        )}
                    </Highlight>
                ) : markdownMode && isMarkdown ? (
                    <div className="markdown-body">
                        <Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
                    </div>
                ) : (
                    <pre className="whitespace-pre-wrap">{content}</pre>
                )}
            </div>
        </div>
    );
};

export default MessageTool;
