import React, { useState } from "react";
import { useChat } from "@langgraph-js/sdk/react";
import { AlertTriangle, ChevronDown, ChevronUp, Play } from "lucide-react";

const InterruptPanel: React.FC = () => {
    const { interruptData, isInterrupted, resumeFromInterrupt } = useChat();
    const [expanded, setExpanded] = useState(true);
    const [responseData, setResponseData] = useState<string>("");
    const [inputMode, setInputMode] = useState<"json" | "text">("json");

    // 如果没有中断数据，不显示面板
    if (!isInterrupted || !interruptData) {
        return null;
    }

    const handleSubmit = () => {
        try {
            let data: any;
            if (inputMode === "json") {
                data = responseData.trim() ? JSON.parse(responseData) : null;
            } else {
                data = responseData;
            }
            resumeFromInterrupt(data);
        } catch (error) {
            console.error("Invalid JSON:", error);
            // 如果 JSON 解析失败，仍然尝试发送原始字符串
            resumeFromInterrupt(responseData);
        }
    };

    const formatInterruptData = (data: any): string => {
        try {
            return JSON.stringify(data, null, 2);
        } catch {
            return String(data);
        }
    };

    return (
        <div className="mx-4 mb-4 bg-amber-50 border border-amber-200 rounded-xl shadow-lg">
            <div className="p-4">
                {/* 标题栏 */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-amber-800">执行已中断</h3>
                    </div>
                    <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-amber-100 rounded transition-colors">
                        {expanded ? <ChevronUp className="w-4 h-4 text-amber-600" /> : <ChevronDown className="w-4 h-4 text-amber-600" />}
                    </button>
                </div>

                {expanded && (
                    <>
                        {/* 中断数据展示 */}
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">中断数据:</div>
                            <pre className="text-xs bg-white p-3 rounded border border-amber-200 overflow-x-auto max-h-40 overflow-y-auto">{formatInterruptData(interruptData)}</pre>
                        </div>

                        {/* 响应输入 */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium text-gray-700">响应数据:</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setInputMode("json")}
                                        className={`px-2 py-1 text-xs rounded ${inputMode === "json" ? "bg-amber-200 text-amber-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                    >
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => setInputMode("text")}
                                        className={`px-2 py-1 text-xs rounded ${inputMode === "text" ? "bg-amber-200 text-amber-800" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                                    >
                                        文本
                                    </button>
                                </div>
                            </div>
                            <textarea
                                value={responseData}
                                onChange={(e) => setResponseData(e.target.value)}
                                placeholder={inputMode === "json" ? '输入 JSON 格式的响应数据，例如: {"key": "value"} 或留空发送 null' : "输入文本响应数据"}
                                className="w-full p-3 text-sm border border-gray-300 rounded resize-none font-mono"
                                rows={4}
                            />
                            <div className="text-xs text-gray-500 mt-1">{inputMode === "json" ? "输入有效的 JSON 或留空" : "输入任意文本内容"}</div>
                        </div>

                        {/* 提交按钮 */}
                        <div className="flex justify-end">
                            <button onClick={handleSubmit} className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors">
                                <Play className="w-4 h-4" />
                                继续执行
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default InterruptPanel;
