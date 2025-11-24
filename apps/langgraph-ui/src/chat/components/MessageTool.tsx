import React, { JSX, memo, useState } from "react";
import { LangGraphClient, RenderMessage, ToolMessage, ToolRenderData } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { useChat } from "@langgraph-js/sdk/react";
import { MessagesBox } from "./MessageBox";
import { Response } from "@/components/ai-elements/response";
import { CodeBlock } from "../../components/ai-elements/code-block";

const TOOL_COLORS = ["bg-white", "bg-white", "bg-white", "bg-white", "bg-white", "bg-white", "bg-white"];

interface MessageToolProps {
    message: ToolMessage & RenderMessage;
    client: LangGraphClient;
    getMessageContent: (content: any) => string;
    formatTokens: (tokens: number) => string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
}

const getToolColorClass = (tool_name: string = "") => {
    let hash = 0;
    for (let i = 0; i < tool_name.length; i++) {
        hash = tool_name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash % TOOL_COLORS.length);
    return TOOL_COLORS[index];
};

const MessageTool: React.FC<MessageToolProps> = ({ message, getMessageContent, formatTokens, isCollapsed, onToggleCollapse }) => {
    const { getToolUIRender, client } = useChat();
    const render = getToolUIRender(message.name || "");
    const bgColorClass = getToolColorClass(message.name || "");
    const onHumanClick = (type: string) => {
        return client?.doneFEToolWaiting(message.id as string, {
            decisions: [
                {
                    type: type,
                },
            ],
        });
    };
    const humanInTheLoopButton = () => {
        const tool = new ToolRenderData(message, client!);
        if (!tool.client.humanInTheLoop) return null;
        for (let i of tool.client.humanInTheLoop) {
            for (let j of i.value.reviewConfigs) {
                if (j.actionName === message.name) {
                    return j.allowedDecisions.map((k) => {
                        return (
                            <button
                                key={k}
                                className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => onHumanClick(k)}
                            >
                                {k}
                            </button>
                        );
                    });
                }
            }
        }
        return null;
    };
    return (
        <div className="flex flex-col w-full">
            {render ? (
                (render(message) as JSX.Element)
            ) : (
                <div className={`flex flex-col w-full ${bgColorClass} rounded-2xl overflow-hidden`}>
                    <div className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-gray-100 transition-colors" onClick={onToggleCollapse}>
                        <div className="text-xs font-medium text-gray-600" onClick={() => console.log(message)}>
                            {message.node_name} | {message.name}
                        </div>
                        <div>{humanInTheLoopButton()}</div>
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
                <button onClick={copyToClipboard} className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    copy
                </button>
                {isJSON && (
                    <button
                        onClick={() => setJsonMode(!jsonMode)}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        json
                    </button>
                )}
                {isMarkdown && (
                    <button
                        onClick={() => setMarkdownMode(!markdownMode)}
                        className="px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        markdown
                    </button>
                )}
            </div>

            <div className="flex flex-col max-h-[300px] overflow-auto bg-white border border-gray-200 rounded-xl p-3 w-full text-xs font-mono whitespace-pre-wrap">
                {jsonMode && isJSON ? (
                    <CodeBlock code={JSON.stringify(JSON.parse(content), null, 2)} language="json"></CodeBlock>
                ) : markdownMode && isMarkdown ? (
                    <div className="markdown-body">
                        <Response>{content}</Response>
                    </div>
                ) : (
                    <pre className="whitespace-pre-wrap">{content}</pre>
                )}
            </div>
        </div>
    );
};

export default MessageTool;
