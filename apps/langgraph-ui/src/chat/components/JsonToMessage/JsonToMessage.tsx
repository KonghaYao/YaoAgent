import React, { useState, useEffect } from "react";
import { MessagesBox } from "../MessageBox";
import { RenderMessage } from "@langgraph-js/sdk";
import { X } from "lucide-react";

interface JsonToMessageProps {
    isOpen: boolean;
    onClose: () => void;
    initialJson?: string | object;
}

const JsonToMessage: React.FC<JsonToMessageProps> = ({ isOpen, onClose, initialJson }) => {
    const [jsonString, setJsonString] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [previewMessages, setPreviewMessages] = useState<RenderMessage[]>([]);

    useEffect(() => {
        // 重置状态当弹窗打开时
        if (isOpen) {
            let initialJsonContent = "";

            if (initialJson) {
                if (typeof initialJson === "string") {
                    initialJsonContent = initialJson;
                } else {
                    try {
                        initialJsonContent = JSON.stringify(initialJson, null, 2);
                    } catch (e) {
                        console.error("Failed to stringify initial JSON", e);
                        initialJsonContent = "";
                    }
                }
            } else {
                // 默认示例消息
                initialJsonContent = JSON.stringify([], null, 2);
            }

            setJsonString(initialJsonContent);
            setError(null);

            // 初始化时尝试解析
            try {
                updatePreview(initialJsonContent);
            } catch (e) {
                console.error("Failed to parse initial JSON", e);
            }
        }
    }, [isOpen, initialJson]);

    // 解析JSON并更新预览
    const updatePreview = (jsonInput: string) => {
        try {
            const parsedJson = JSON.parse(jsonInput);
            let message: RenderMessage[] = [];
            if (Array.isArray(parsedJson)) {
                message = parsedJson;
            } else {
                message = parsedJson.messages;
            }
            // 确保消息有必要的字段
            if (!Array.isArray(message)) {
                throw new Error("JSON 格式无效，请检查后重试");
            }
            setPreviewMessages(message);
            setError(null);
        } catch (e) {
            setError("JSON 格式无效，请检查后重试");
            console.error("Invalid JSON format:", e);
        }
    };

    // 当JSON输入变化时更新预览
    useEffect(() => {
        if (jsonString) {
            updatePreview(jsonString);
        }
    }, [jsonString]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-[90%] max-w-[1200px] h-[80vh] max-h-[800px] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">JSON 消息预览</h2>
                    <button onClick={onClose} className="p-1.5 text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    <div className="flex-1 p-4 flex flex-col border-r border-gray-200">
                        <textarea
                            value={jsonString}
                            onChange={(e) => setJsonString(e.target.value)}
                            rows={20}
                            placeholder="输入JSON消息格式..."
                            className="flex-1 font-mono text-sm p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                        <div className="bg-white rounded-lg p-4 min-h-full">
                            {previewMessages?.length > 0 ? (
                                <MessagesBox renderMessages={previewMessages} collapsedTools={[]} toggleToolCollapse={() => {}} client={null as any} />
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500 italic">请输入有效的JSON以查看消息预览</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonToMessage;
