import React from "react";
import { useHistory } from "../context/HistoryContext";
import { useChat } from "../context/ChatContext";

interface HistoryListProps {
    onClose: () => void;
    formatTime: (date: Date) => string;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose, formatTime }) => {
    const { threads, currentChatId } = useHistory();
    const { client } = useChat();
    return (
        <div className="history-list">
            <div className="history-header">
                <h3>历史记录</h3>
                <button className="close-button" onClick={onClose}>
                    关闭
                </button>
            </div>
            <div className="history-content">
                {threads.length === 0 ? (
                    <div className="empty-history">暂无历史记录</div>
                ) : (
                    <div className="history-items">
                        {threads
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((thread) => (
                                <div
                                    className={`history-item ${thread.thread_id === currentChatId ? "active" : ""}`}
                                    key={thread.thread_id}
                                    onClick={() => {
                                        client?.resetThread(thread.metadata?.graph_id, thread.thread_id);
                                    }}
                                >
                                    <div className="history-title">{thread?.values?.messages?.[0]?.content}</div>
                                    <div className="history-time">{formatTime(new Date(thread.created_at))}</div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryList;
