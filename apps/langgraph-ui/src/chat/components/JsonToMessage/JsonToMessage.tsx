import React, { useState, useEffect } from "react";
import { MessagesBox } from "../MessageBox";
import "./JsonToMessage.css";
import { RenderMessage } from "@langgraph-js/sdk";

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
        <div className="json-to-message-overlay">
            <div className="json-to-message-content">
                <div className="json-to-message-header">
                    <h2>JSON 消息预览</h2>
                    <button onClick={onClose} className="close-button">
                        ×
                    </button>
                </div>

                <div className="json-to-message-body">
                    <div className="json-editor-pane">
                        <textarea value={jsonString} onChange={(e) => setJsonString(e.target.value)} rows={20} placeholder="输入JSON消息格式..." />
                        {error && <p className="error-message">{error}</p>}
                    </div>

                    <div className="message-preview-pane">
                        <div className="preview-container chat-messages">
                            {previewMessages?.length > 0 ? (
                                <MessagesBox renderMessages={previewMessages} collapsedTools={[]} toggleToolCollapse={() => {}} client={null as any} />
                            ) : (
                                <div className="no-preview">请输入有效的JSON以查看消息预览</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonToMessage;
