import React, { useState, useRef, useEffect, useCallback } from "react";
import MessageHuman from "./MessageHuman";
import MessageAI from "./MessageAI";
import MessageTool from "./MessageTool";
import { formatTokens, getMessageContent, LangGraphClient, RenderMessage } from "@langgraph-js/sdk";
import { useChat } from "@langgraph-js/sdk/react";
import { CodeBlock } from "@/components/ai-elements/code-block";

interface MessageState {
    showDetail: boolean;
    showContextMenu: boolean;
    contextMenuPosition: { x: number; y: number };
}

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
    // 使用 Map 来管理每个消息的状态
    const [messageStates, setMessageStates] = useState<Map<string, MessageState>>(new Map());
    const messageRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

    const updateMessageState = useCallback((messageId: string, updates: Partial<MessageState>) => {
        setMessageStates((prev) => {
            const newStates = new Map(prev);
            const currentState = newStates.get(messageId) || {
                showDetail: false,
                showContextMenu: false,
                contextMenuPosition: { x: 0, y: 0 },
            };
            newStates.set(messageId, { ...currentState, ...updates });
            return newStates;
        });
    }, []);

    const handleContextMenu = useCallback(
        (e: React.MouseEvent, messageId: string) => {
            e.preventDefault();
            updateMessageState(messageId, {
                contextMenuPosition: { x: e.clientX, y: e.clientY },
                showContextMenu: true,
            });
        },
        [updateMessageState]
    );

    const handleCloseContextMenu = useCallback(
        (messageId: string) => {
            updateMessageState(messageId, { showContextMenu: false });
        },
        [updateMessageState]
    );

    // 点击外部关闭右键菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            messageStates.forEach((state, messageId) => {
                if (state.showContextMenu) {
                    const ref = messageRefs.current.get(messageId);
                    if (ref && !ref.contains(event.target as Node)) {
                        handleCloseContextMenu(messageId);
                    }
                }
            });
        };

        if (Array.from(messageStates.values()).some((state) => state.showContextMenu)) {
            document.addEventListener("click", handleClickOutside);
        }

        return () => {
            document.removeEventListener("click", handleClickOutside);
        };
    }, [messageStates, handleCloseContextMenu]);
    return (
        <div className="flex flex-col gap-5 w-full">
            {renderMessages.map((message, index) => {
                const messageId = message.unique_id || `message-${index}`;
                const messageState = messageStates.get(messageId) || {
                    showDetail: false,
                    showContextMenu: false,
                    contextMenuPosition: { x: 0, y: 0 },
                };

                return (
                    <div
                        key={messageId}
                        ref={(el) => {
                            if (el) {
                                messageRefs.current.set(messageId, el);
                            }
                        }}
                        onContextMenu={(e) => handleContextMenu(e, messageId)}
                    >
                        {message.type === "human" ? (
                            <MessageHuman message={message} content={message.content} />
                        ) : message.type === "tool" ? (
                            <MessageTool message={message} isCollapsed={collapsedTools.includes(message.id!)} onToggleCollapse={() => toggleToolCollapse(message.id!)} />
                        ) : (
                            <MessageAI message={message} />
                        )}
                        {messageState.showDetail && <CodeBlock code={JSON.stringify(message, null, 2)} language="json" />}
                    </div>
                );
            })}
        </div>
    );
};
