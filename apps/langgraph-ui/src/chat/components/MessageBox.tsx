import React from "react";
import MessageHuman from "./MessageHuman";
import MessageAI from "./MessageAI";
import MessageTool from "./MessageTool";
import { formatTokens, getMessageContent, LangGraphClient, RenderMessage } from "@langgraph-js/sdk";

export const MessagesBox = ({
    renderMessages,
    collapsedTools,
    toggleToolCollapse,
    client,
}: {
    renderMessages: RenderMessage[];
    collapsedTools: string[];
    toggleToolCollapse: (id: string) => void;
    client: LangGraphClient;
}) => {
    return (
        <>
            {renderMessages.map((message) =>
                message.type === "human" ? (
                    <MessageHuman content={message.content} key={message.unique_id} />
                ) : message.type === "tool" ? (
                    <MessageTool
                        key={message.unique_id}
                        message={message}
                        client={client!}
                        getMessageContent={getMessageContent}
                        formatTokens={formatTokens}
                        isCollapsed={collapsedTools.includes(message.id!)}
                        onToggleCollapse={() => toggleToolCollapse(message.id!)}
                    />
                ) : (
                    <MessageAI key={message.unique_id} message={message} />
                )
            )}
        </>
    );
};
