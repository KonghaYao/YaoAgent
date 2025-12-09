import React, { JSX, memo, useState } from "react";
import { getMessageContent, LangGraphClient, RenderMessage, ToolMessage, ToolRenderData } from "@langgraph-js/sdk";
import { UsageMetadata } from "./UsageMetadata";
import { useChat } from "@langgraph-js/sdk/react";
import { MessagesBox } from "./MessageBox";
import { Response } from "@/components/ai-elements/response";
import { CodeBlock } from "../../components/ai-elements/code-block";
import { Reasoning } from "./Reasoning";
import { HumanInTheLoopControls } from "./HumanInTheLoopControls";
import copy from "copy-to-clipboard";
const getStatusColor = (status: string) => {
    switch (status) {
        case "done":
            return "text-green-600 bg-green-50 border-green-200";
        case "loading":
            return "text-blue-600 bg-blue-50 border-blue-200";
        case "processing":
            return "text-orange-600 bg-orange-50 border-orange-200";
        case "idle":
        default:
            return "text-gray-600 bg-gray-50 border-gray-200";
    }
};

const getStatusIcon = (status: string) => {
    switch (status) {
        case "done":
            return "✓";
        case "loading":
            return "⟳";
        case "processing":
            return "⋯";
        case "idle":
        default:
            return "○";
    }
};
const TOOL_COLORS = ["bg-white", "bg-white", "bg-white", "bg-white", "bg-white", "bg-white", "bg-white"];

interface MessageToolProps {
    message: ToolMessage & RenderMessage;
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

const MessageTool: React.FC<MessageToolProps> = ({ message, isCollapsed, onToggleCollapse }) => {
    const { getToolUIRender, client } = useChat();
    const render = getToolUIRender(message.name || "");
    const bgColorClass = getToolColorClass(message.name || "");

    const tool = new ToolRenderData(message, client!);

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
                        <div className="flex gap-2">
                            {tool.state === "interrupted" ? <HumanInTheLoopControls tool={tool} /> : null}
                            <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border ${getStatusColor(tool.state)}`}>
                                <span>{getStatusIcon(tool.state)}</span>
                                <span>{tool.state}</span>
                            </div>
                        </div>
                    </div>

                    {!isCollapsed && (
                        <div className="flex flex-col gap-4 px-5 pb-4">
                            {message.additional_kwargs?.reasoning_content ? <Reasoning message={message} /> : null}
                            <Previewer content={JSON.stringify(tool.getInputRepaired(), null, 2) || ""} mode="json" />
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
            {message.sub_messages?.length ? (
                <div className="flex flex-col pl-6 py-3 ml-4 border-l-2 border-gray-200">
                    <MessagesBox renderMessages={message.sub_messages} collapsedTools={[]} toggleToolCollapse={(id) => {}} client={client!} />
                </div>
            ) : null}
        </div>
    );
};

const Previewer = ({ content, mode }: { content: string; mode?: string }) => {
    const validJSON = () => {
        try {
            JSON.parse(content);
            return true;
        } catch (e) {
            return false;
        }
    };
    const isJSON = mode === "json" || (content.startsWith("{") && content.endsWith("}") && validJSON());
    const isMarkdown = mode === "markdown" || content.includes("#") || content.includes("```") || content.includes("*");
    const [jsonMode, setJsonMode] = useState(isJSON);
    const [markdownMode, setMarkdownMode] = useState(false);
    const copyToClipboard = () => {
        copy(content);
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

            <div className="flex flex-col max-h-[300px] bg-white border border-gray-200 rounded-xl p-3 w-full text-xs font-mono">
                <div className="overflow-auto max-h-full">
                    {jsonMode && isJSON ? (
                        <div className="overflow-visible">
                            <CodeBlock code={JSON.stringify(JSON.parse(content), null, 2)} language="json"></CodeBlock>
                        </div>
                    ) : markdownMode && isMarkdown ? (
                        <div className="whitespace-pre-wrap">
                            <Response>{content}</Response>
                        </div>
                    ) : (
                        <pre
                            className=" whitespace-pre-wrap"
                            style={{
                                overflowWrap: "break-word",
                            }}
                        >
                            <code className="whitespace-pre-wrap">{content}</code>
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MessageTool;
