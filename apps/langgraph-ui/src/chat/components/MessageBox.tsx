import React, { useState, useRef, useEffect } from "react";
import MessageHuman from "./MessageHuman";
import MessageAI from "./MessageAI";
import MessageTool from "./MessageTool";
import { formatTokens, getMessageContent, LangGraphClient, RenderMessage } from "@langgraph-js/sdk";
import { JSONViewer } from "./JSONViewer";
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
        <div className="flex flex-col gap-4 w-full">
            {renderMessages.map((message, index) => {
                const [showDetail, setShowDetail] = useState(false);
                const [showContextMenu, setShowContextMenu] = useState(false);
                const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
                const messageRef = useRef<HTMLDivElement>(null);

                const handleContextMenu = (e: React.MouseEvent) => {
                    e.preventDefault();
                    setContextMenuPosition({ x: e.clientX, y: e.clientY });
                    setShowContextMenu(true);
                };

                const handleCloseContextMenu = () => {
                    setShowContextMenu(false);
                };

                const handleCopyMessage = () => {
                    navigator.clipboard.writeText(getMessageContent(message.content));
                    handleCloseContextMenu();
                };

                const handleToggleDetail = () => {
                    setShowDetail(!showDetail);
                    handleCloseContextMenu();
                };

                // 点击外部关闭右键菜单
                useEffect(() => {
                    const handleClickOutside = (event: MouseEvent) => {
                        if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
                            setShowContextMenu(false);
                        }
                    };

                    if (showContextMenu) {
                        document.addEventListener("click", handleClickOutside);
                    }

                    return () => {
                        document.removeEventListener("click", handleClickOutside);
                    };
                }, [showContextMenu]);

                return (
                    <div key={message.unique_id} ref={messageRef} onContextMenu={handleContextMenu} className="cursor-context-menu">
                        {message.type === "human" ? (
                            <MessageHuman content={message.content} />
                        ) : message.type === "tool" ? (
                            <MessageTool
                                message={message}
                                client={client!}
                                getMessageContent={getMessageContent}
                                formatTokens={formatTokens}
                                isCollapsed={collapsedTools.includes(message.id!)}
                                onToggleCollapse={() => toggleToolCollapse(message.id!)}
                            />
                        ) : (
                            <MessageAI message={message} />
                        )}
                        {showDetail && <JSONViewer data={message} />}
                        {showContextMenu && (
                            <div
                                className="fixed bg-white border border-gray-200 rounded shadow-lg z-50 py-1 min-w-[150px]"
                                style={{ left: contextMenuPosition.x, top: contextMenuPosition.y }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button className="w-full bg-white px-3 py-2 text-left hover:bg-gray-50 text-sm" onClick={handleCopyMessage}>
                                    复制消息内容
                                </button>
                                <button className="w-full bg-white px-3 py-2 text-left hover:bg-gray-50 text-sm" onClick={handleToggleDetail}>
                                    {showDetail ? "隐藏详情" : "显示详情"}
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
