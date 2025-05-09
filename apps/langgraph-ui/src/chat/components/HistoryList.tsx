import React from "react";
import { useChat } from "../context/ChatContext";
import { getHistoryContent } from "@langgraph-js/sdk";

interface HistoryListProps {
    onClose: () => void;
    formatTime: (date: Date) => string;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose, formatTime }) => {
    const { historyList, currentChatId, refreshHistoryList, createNewChat, deleteHistoryChat, toHistoryChat } = useChat();
    return (
        <div className="history-list">
            <div className="history-header">
                <div className="header-left">
                    <h3>历史记录</h3>
                    <button className="refresh-button" onClick={refreshHistoryList} title="刷新列表">
                        🔁
                    </button>
                </div>
                <button className="close-button" onClick={onClose} title="关闭">
                    ❌
                </button>
            </div>
            <div className="history-content">
                <div
                    className="history-items"
                    onClick={() => {
                        createNewChat();
                    }}
                >
                    <div className="history-item">
                        <div className="history-title"> New Chat</div>
                    </div>
                </div>
                {historyList.length === 0 ? (
                    <div className="empty-history">暂无历史记录</div>
                ) : (
                    <div className="history-items">
                        {historyList
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((thread) => (
                                <div className={`history-item ${thread.thread_id === currentChatId ? "active" : ""}`} key={thread.thread_id}>
                                    <div className="history-info">
                                        <div className="history-title">{getHistoryContent(thread)}</div>
                                        <div className="history-meta">
                                            <span className="history-time">{formatTime(new Date(thread.created_at))}</span>
                                            <span className="history-status">{thread.status}</span>
                                        </div>
                                    </div>
                                    <div className="history-actions">
                                        <button
                                            className="action-button"
                                            onClick={() => {
                                                toHistoryChat(thread);
                                            }}
                                            title="恢复对话"
                                        >
                                            ⏪
                                        </button>
                                        <button
                                            className="action-button"
                                            onClick={async () => {
                                                await deleteHistoryChat(thread);
                                            }}
                                            title="删除对话"
                                        >
                                            ❌
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
            <style>{`
                .history-list {
                    background: #fff;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                }

                .history-header {
                    padding: 16px;
                    border-bottom: 1px solid #eee;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .history-header h3 {
                    margin: 0;
                    font-size: 18px;
                    color: #333;
                }

                .history-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                }

                .history-items {
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .history-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-radius: 6px;
                    background: #f8f9fa;
                    transition: all 0.2s ease;
                }

                .history-item:hover {
                    background: #f0f2f5;
                }

                .history-item.active {
                    background: #e6f7ff;
                    border: 1px solid #91d5ff;
                }

                .history-info {
                    flex: 1;
                    min-width: 0;
                }

                .history-title {
                    font-size: 14px;
                    color: #333;
                    margin-bottom: 4px;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .history-meta {
                    display: flex;
                    gap: 12px;
                    color: #666;
                    font-size: 12px;
                }

                .history-actions {
                    display: flex;
                    gap: 8px;
                    margin-left: 12px;
                }

                .action-button, .close-button, .refresh-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 6px;
                    font-size: 16px;
                    border-radius: 4px;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .action-button:hover, .close-button:hover, .refresh-button:hover {
                    background: rgba(0, 0, 0, 0.05);
                    transform: scale(1.1);
                }

                .empty-history {
                    text-align: center;
                    color: #999;
                    padding: 32px 0;
                }
            `}</style>
        </div>
    );
};

export default HistoryList;
