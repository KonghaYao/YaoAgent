import React from "react";
import { useChat } from "../context/ChatContext";
import { getHistoryContent } from "@langgraph-js/sdk";
import { RefreshCw, X, RotateCcw, Trash2 } from "lucide-react";

interface HistoryListProps {
    onClose: () => void;
    formatTime: (date: Date) => string;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose, formatTime }) => {
    const { historyList, currentChatId, refreshHistoryList, createNewChat, deleteHistoryChat, toHistoryChat } = useChat();
    return (
        <div className="w-80 bg-white rounded-lg shadow-md h-full flex flex-col border-r">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center h-16">
                <div className="flex items-center gap-3">
                    <h3 className="m-0 text-lg text-gray-800">历史记录</h3>
                    <button
                        className="p-1.5 text-base rounded bg-blue-100 hover:bg-blue-200 transition-all duration-200 flex items-center justify-center hover:scale-110 group"
                        onClick={refreshHistoryList}
                        title="刷新列表"
                    >
                        <RefreshCw className="w-4 h-4 text-blue-600 group-hover:text-blue-700 group-hover:rotate-180 transition-all duration-300" />
                    </button>
                </div>
                <button
                    className="p-1.5 text-base rounded bg-red-100 hover:bg-red-200 transition-all duration-200 flex items-center justify-center hover:scale-110 group"
                    onClick={onClose}
                    title="关闭"
                >
                    <X className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <div
                    className="flex flex-col gap-3 cursor-pointer"
                    onClick={() => {
                        createNewChat();
                    }}
                >
                    <div className="flex justify-between items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
                        <div className="text-sm text-gray-800 truncate">New Chat</div>
                    </div>
                </div>
                {historyList.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">暂无历史记录</div>
                ) : (
                    <div className="flex flex-col gap-3 mt-3">
                        {historyList
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((thread) => (
                                <div
                                    className={`flex justify-between items-center p-3 rounded-lg transition-colors duration-200 ${
                                        thread.thread_id === currentChatId ? "bg-blue-50 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                                    }`}
                                    key={thread.thread_id}
                                >
                                    <div className="flex-1 min-w-0 mr-2">
                                        <div className="text-sm text-gray-800 mb-1 truncate max-w-[180px]">{getHistoryContent(thread)}</div>
                                        <div className="flex gap-3 text-xs text-gray-500">
                                            <span className="truncate max-w-[100px]">{formatTime(new Date(thread.created_at))}</span>
                                            <span className="truncate max-w-[60px]">{thread.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            className="p-1.5 text-base rounded bg-green-100 hover:bg-green-200 transition-all duration-200 flex items-center justify-center hover:scale-110 group"
                                            onClick={() => {
                                                toHistoryChat(thread);
                                            }}
                                            title="恢复对话"
                                        >
                                            <RotateCcw className="w-4 h-4 text-green-600 group-hover:text-green-700 group-hover:-rotate-180 transition-all duration-300" />
                                        </button>
                                        <button
                                            className="p-1.5 text-base rounded bg-red-100 hover:bg-red-200 transition-all duration-200 flex items-center justify-center hover:scale-110 group"
                                            onClick={async () => {
                                                await deleteHistoryChat(thread);
                                            }}
                                            title="删除对话"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600 group-hover:text-red-700" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryList;
