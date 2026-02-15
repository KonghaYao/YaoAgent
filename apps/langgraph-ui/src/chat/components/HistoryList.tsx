import React, { useState } from "react";
import { useChat } from "@langgraph-js/sdk/react";
import { formatTime, getHistoryContent } from "@langgraph-js/sdk";
import { RefreshCw, X, RotateCcw, Trash2, ChevronLeft, ChevronRight, Filter, XCircle, MoreHorizontal } from "lucide-react";

interface HistoryListProps {
    onClose: () => void;
}

const HistoryList: React.FC<HistoryListProps> = ({ onClose }) => {
    const {
        historyList,
        historyPagination,
        historyFilter,
        currentChatId,
        refreshSessionList,
        createNewChat,
        deleteHistoryChat,
        toHistoryChat,
        setHistoryPage,
        setHistoryPageSize,
        setHistoryFilter,
        resetHistoryFilter,
    } = useChat();

    const [showFilter, setShowFilter] = useState(false);
    const [metadataInput, setMetadataInput] = useState("");
    const [showPageSizeMenu, setShowPageSizeMenu] = useState(false);

    const pagination = historyPagination;
    const filter = historyFilter;

    const handlePageChange = (newPage: number) => {
        if (newPage < 1) return;
        const totalPages = Math.ceil(pagination.total / pagination.pageSize);
        if (newPage > totalPages && historyList.length < pagination.pageSize) return;
        setHistoryPage(newPage);
    };

    const handleApplyFilter = () => {
        let parsedMetadata = null;
        if (metadataInput.trim()) {
            try {
                parsedMetadata = JSON.parse(metadataInput);
            } catch (e) {
                alert("Invalid JSON format for metadata");
                return;
            }
        }
        setHistoryFilter({ metadata: parsedMetadata });
        setShowFilter(false);
    };

    const handleClearFilter = () => {
        setMetadataInput("");
        resetHistoryFilter();
        setShowFilter(false);
    };

    const totalPages = Math.ceil(pagination.total / pagination.pageSize);

    return (
        <section className="bg-white h-full flex flex-col">
            <div className="px-5 flex justify-between items-center py-6 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <h3 className="m-0 text-base font-semibold text-gray-700">历史记录</h3>
                </div>
                <div className="flex gap-1.5">
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-300 transition-colors flex items-center justify-center group" onClick={() => setShowFilter(!showFilter)} title="筛选">
                        <Filter className={`w-4 h-4 text-gray-600 ${showFilter ? "text-blue-500" : ""}`} />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-300 transition-colors flex items-center justify-center group" onClick={refreshSessionList} title="刷新列表">
                        <RefreshCw className="w-4 h-4 text-gray-600 group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-100 hover:bg-gray-300 transition-colors flex items-center justify-center group" onClick={onClose} title="关闭">
                        <X className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            {/* 筛选面板 */}
            {showFilter && (
                <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex flex-col gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">状态筛选</label>
                            <select
                                value={filter.status || "all"}
                                onChange={(e) => setHistoryFilter({ status: e.target.value === "all" ? null : (e.target.value as any) })}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">全部状态</option>
                                <option value="idle">空闲</option>
                                <option value="busy">忙碌</option>
                                <option value="interrupted">中断</option>
                                <option value="error">错误</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">排序字段</label>
                            <select
                                value={filter.sortBy}
                                onChange={(e) => setHistoryFilter({ sortBy: e.target.value as any })}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="updated_at">更新时间</option>
                                <option value="created_at">创建时间</option>
                                <option value="thread_id">会话 ID</option>
                                <option value="status">状态</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">排序顺序</label>
                            <select
                                value={filter.sortOrder}
                                onChange={(e) => setHistoryFilter({ sortOrder: e.target.value as any })}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="desc">降序</option>
                                <option value="asc">升序</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">元数据 (JSON 格式)</label>
                            <textarea
                                value={metadataInput}
                                onChange={(e) => setMetadataInput(e.target.value)}
                                placeholder='{"key": "value"}'
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleApplyFilter} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors">
                                应用筛选
                            </button>
                            <button
                                onClick={handleClearFilter}
                                className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                清除筛选
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                        {historyList.map((thread) => (
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
                                        <span
                                            className={`truncate max-w-[60px] ${
                                                thread.status === "error"
                                                    ? "text-red-500"
                                                    : thread.status === "interrupted"
                                                      ? "text-orange-500"
                                                      : thread.status === "busy"
                                                        ? "text-blue-500"
                                                        : "text-gray-400"
                                            }`}
                                        >
                                            {thread.status}
                                        </span>
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

            {/* 合并的分页控制 */}
            {historyList.length > 0 && (
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        {/* 每页显示数量 */}
                        <div className="relative">
                            <button
                                onClick={() => setShowPageSizeMenu(!showPageSizeMenu)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                title="每页显示数量"
                            >
                                <span>{pagination.pageSize}</span> 条
                            </button>

                            {showPageSizeMenu && (
                                <div className="absolute bottom-full left-0 mb-1 w-24 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                                    {[5, 10, 20, 50].map((size) => (
                                        <button
                                            key={size}
                                            onClick={() => {
                                                setHistoryPageSize(size);
                                                setShowPageSizeMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg"
                                        >
                                            {size} 条
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 页码信息 - 使用更紧凑的显示 */}
                        <div className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-600">
                            <span className="font-medium">{pagination.page}</span>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-400">{totalPages}</span>
                        </div>

                        {/* 分页按钮 */}
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={pagination.page === 1}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    pagination.page === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-200 text-gray-600 border border-gray-200"
                                }`}
                                title="上一页"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>

                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={historyList.length < pagination.pageSize}
                                className={`p-1.5 rounded-lg transition-colors ${
                                    historyList.length < pagination.pageSize ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-200 text-gray-600 border border-gray-200"
                                }`}
                                title="下一页"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default HistoryList;
