import React from "react";
import { useChat } from "@langgraph-js/sdk/react";
import { formatTime, getHistoryContent } from "@langgraph-js/sdk";
import { RefreshCw, X, RotateCcw, Trash2 } from "lucide-react";

interface HistoryListProps {
    onClose: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose }) => {
    const { historyList, currentChatId, refreshHistoryList, createNewChat, deleteHistoryChat, toHistoryChat } = useChat();
    return (
        <section className="bg-white h-full flex flex-col rounded-2xl shadow-lg shadow-gray-200">
            <div className="px-5 flex justify-between items-center py-6">
                <div className="flex items-center gap-3">
                    <h3 className="m-0 text-base font-semibold text-gray-700">历史记录</h3>
                </div>
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-300 transition-colors flex items-center justify-center group" onClick={refreshHistoryList} title="刷新列表">
                    <RefreshCw className="w-4 h-4 text-gray-600 group-hover:rotate-180 transition-transform duration-300" />
                </button>
                <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-300 transition-colors flex items-center justify-center group" onClick={onClose} title="关闭">
                    <X className="w-4 h-4 text-red-500" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2">
                <div
                    className="cursor-pointer mb-3"
                    onClick={() => {
                        createNewChat();
                    }}
                >
                    <div className="flex justify-between items-center px-4 py-3 rounded-xl bg-blue-50/80 hover:bg-blue-200/80 transition-colors">
                        <div className="text-sm text-gray-700 font-medium truncate">New Chat</div>
                    </div>
                </div>
                {historyList.length === 0 ? (
                    <div className="text-center text-gray-400 py-10 text-sm">暂无历史记录</div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {historyList
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .map((thread) => (
                                <div
                                    className={`flex justify-between items-center px-4 py-3 rounded-xl transition-colors ${
                                        thread.thread_id === currentChatId ? "bg-blue-50/80" : "bg-gray-50/60 hover:bg-gray-200/80"
                                    }`}
                                    key={thread.thread_id}
                                >
                                    <div
                                        className="flex-1 min-w-0 mr-2"
                                        onClick={() => {
                                            toHistoryChat(thread);
                                        }}
                                    >
                                        <div className="text-sm text-gray-700 mb-1 truncate max-w-[180px]">{getHistoryContent(thread)}</div>
                                        <div className="flex gap-3 text-xs text-gray-400">
                                            <span className="truncate max-w-[100px]">{formatTime(new Date(thread.created_at))}</span>
                                            <span className="truncate max-w-[60px]">{thread.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                        <button
                                            className="p-2 rounded-lg bg-white/60 hover:bg-gray-200 transition-colors flex items-center justify-center group"
                                            onClick={() => {
                                                toHistoryChat(thread);
                                            }}
                                            title="恢复对话"
                                        >
                                            <RotateCcw className="w-3.5 h-3.5 text-gray-600 group-hover:-rotate-180 transition-transform duration-300" />
                                        </button>
                                        <button
                                            className="p-2 rounded-lg bg-white/60 hover:bg-gray-200 transition-colors flex items-center justify-center group"
                                            onClick={async () => {
                                                await deleteHistoryChat(thread);
                                            }}
                                            title="删除对话"
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default HistoryList;
