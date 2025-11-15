import React, { useState, useEffect } from "react";
import { LLMModel } from "../../../server/type";
import { X } from "lucide-react";

interface ModelTesterPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

interface TestResult {
    success: boolean;
    error?: string;
    response?: string;
    timestamp?: string;
}

const ModelTesterPopup: React.FC<ModelTesterPopupProps> = ({ isOpen, onClose }) => {
    const [formData, setFormData] = useState<LLMModel>({
        model_name: "",
        provider: "",
        base_url: "",
        token: "",
        messages: [{ role: "user", content: "Hello, how are you?" }],
    });
    const [isTesting, setIsTesting] = useState(false);
    const [testResult, setTestResult] = useState<TestResult | null>(null);
    const [streamingResponse, setStreamingResponse] = useState<any>(null);
    const [modelNameHistory, setModelNameHistory] = useState<string[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // 从 localStorage 加载保存的配置
            const savedConfig = localStorage.getItem("model-tester-config");
            if (savedConfig) {
                try {
                    const config = JSON.parse(savedConfig);
                    setFormData((prev) => ({ ...prev, ...config }));
                } catch (e) {
                    console.error("Failed to load saved config:", e);
                }
            }

            // 从 localStorage 加载模型名称历史记录
            const savedHistory = localStorage.getItem("model-tester-name-history");
            if (savedHistory) {
                try {
                    const history = JSON.parse(savedHistory);
                    setModelNameHistory(Array.isArray(history) ? history : []);
                } catch (e) {
                    console.error("Failed to load model name history:", e);
                }
            }
        }
    }, [isOpen]);

    const handleInputChange = (field: keyof LLMModel, value: any) => {
        setFormData((prev) => {
            const newState = { ...prev, [field]: value };
            saveConfigToLocalStorage({ [field]: value });
            return newState;
        });
    };

    const saveConfigToLocalStorage = (config: Partial<LLMModel>) => {
        const currentConfig = JSON.parse(localStorage.getItem("model-tester-config") || "{}");
        const updatedConfig = { ...currentConfig, ...config };
        localStorage.setItem("model-tester-config", JSON.stringify(updatedConfig));
    };

    const addToModelNameHistory = (modelName: string) => {
        if (!modelName.trim()) return;

        setModelNameHistory((prev) => {
            const filtered = prev.filter((name) => name !== modelName);
            const newHistory = [modelName, ...filtered].slice(0, 5);
            localStorage.setItem("model-tester-name-history", JSON.stringify(newHistory));
            return newHistory;
        });
    };

    const handleMessageChange = (index: number, field: string, value: string) => {
        const newMessages = [...formData.messages];
        (newMessages[index] as any)[field] = value;
        const updatedMessages = [...newMessages];
        setFormData((prev) => {
            const newState = { ...prev, messages: updatedMessages };
            saveConfigToLocalStorage({ messages: updatedMessages });
            return newState;
        });
    };

    const addMessage = () => {
        setFormData((prev) => {
            const newMessages = [...prev.messages, { role: "user", content: "" }];
            saveConfigToLocalStorage({ messages: newMessages });
            return {
                ...prev,
                messages: newMessages,
            };
        });
    };

    const removeMessage = (index: number) => {
        if (formData.messages.length > 1) {
            setFormData((prev) => {
                const newMessages = prev.messages.filter((_, i) => i !== index);
                saveConfigToLocalStorage({ messages: newMessages });
                return {
                    ...prev,
                    messages: newMessages,
                };
            });
        }
    };

    const testModel = async () => {
        if (!formData.model_name || !formData.token) {
            setTestResult({
                success: false,
                error: "请填写模型名称和 API Token",
                timestamp: new Date().toISOString(),
            });
            return;
        }

        setIsTesting(true);
        setTestResult(null);
        setStreamingResponse(null);

        try {
            const response = await fetch("/api/open-smith/llm/test-model", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            // 使用 Web Stream API 处理响应流
            const stream = response.body;
            if (!stream) {
                throw new Error("无法读取响应流");
            }

            // 将原始流通过解析器管道，然后读取结果
            await stream.pipeThrough(new TextDecoderStream()).pipeTo(
                new WritableStream({
                    write(chunk) {
                        // 每个 chunk 都是完整的 SSE 事件，直接处理
                        const lines = chunk.split("\n");
                        let eventData = "";

                        for (const line of lines) {
                            if (line.startsWith("data: ")) {
                                eventData = line.slice(6); // 移除 'data: ' 前缀
                                break;
                            } else if (line.trim() && !line.startsWith(":")) {
                                // 如果不是注释行也不是 data 行，可能就是直接的数据
                                eventData = line;
                                break;
                            }
                        }

                        if (eventData.trim()) {
                            try {
                                const data = JSON.parse(eventData);
                                setStreamingResponse(data);
                            } catch (e) {
                                console.error("Failed to parse SSE data:", eventData, e);
                            }
                        }
                    },
                    close() {
                        // 流结束，无需额外处理
                        console.log("Stream closed");
                    },
                    abort(reason) {
                        console.log("Stream aborted:", reason);
                    },
                })
            );

            setTestResult({
                success: true,
                response: "", // 响应内容已经通过 streamingResponse 显示
                timestamp: new Date().toISOString(),
            });

            // 添加到模型名称历史记录
            addToModelNameHistory(formData.model_name);

            // 保存配置到 localStorage
            saveConfigToLocalStorage({
                model_name: formData.model_name,
                provider: formData.provider,
                base_url: formData.base_url,
                token: formData.token,
                messages: formData.messages,
            });
        } catch (error: any) {
            setTestResult({
                success: false,
                error: error.message || "测试失败",
                timestamp: new Date().toISOString(),
            });
        } finally {
            setIsTesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 flex flex-col overflow-hidden" style={{ height: "85vh" }}>
                <div className="px-6 py-5 bg-white/80 backdrop-blur-sm border-b border-gray-200 flex items-start justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-800">模型测试器</h2>
                        <p className="text-sm text-gray-500 mt-1">测试您的 LLM 模型配置是否正确工作</p>
                    </div>
                    <button onClick={onClose} className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors focus:outline-none">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="flex gap-6 h-full">
                        {/* 左侧配置栏 */}
                        <div className="w-80 flex-shrink-0">
                            <h3 className="text-md font-medium text-gray-700 mb-4">API 配置</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">提供商</label>
                                    <select
                                        value={formData.provider || "openai"}
                                        onChange={(e) => handleInputChange("provider", e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                                    >
                                        <option value="openai">OpenAI</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Base URL</label>
                                    <input
                                        type="text"
                                        value={formData.base_url || ""}
                                        onChange={(e) => handleInputChange("base_url", e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">API Token</label>
                                    <input
                                        type="password"
                                        value={formData.token || ""}
                                        onChange={(e) => handleInputChange("token", e.target.value)}
                                        placeholder="您的 API Token"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 右侧内容栏 */}
                        <div className="flex-1 flex flex-col">
                            {/* 模型名称和历史记录 */}
                            <div className="mb-6">
                                <h3 className="text-md font-medium text-gray-700 mb-4">模型配置</h3>
                                <div className="relative">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">模型名称</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={formData.model_name}
                                            onChange={(e) => handleInputChange("model_name", e.target.value)}
                                            onFocus={() => setShowHistory(true)}
                                            onBlur={() => setTimeout(() => setShowHistory(false), 200)}
                                            placeholder="例如: gpt-4, claude-3-sonnet"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                        {modelNameHistory.length > 0 && (
                                            <button type="button" onClick={() => setShowHistory(!showHistory)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                                                ▼
                                            </button>
                                        )}
                                    </div>
                                    {showHistory && modelNameHistory.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                            {modelNameHistory.map((name, index) => (
                                                <div
                                                    key={index}
                                                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                                    onClick={() => {
                                                        handleInputChange("model_name", name);
                                                        setShowHistory(false);
                                                    }}
                                                >
                                                    {name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 消息配置 */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-md font-medium text-gray-700">测试消息</h3>
                                    <button onClick={addMessage} className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                        添加消息
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formData.messages.map((message, index) => (
                                        <div key={index} className="flex gap-3 items-start">
                                            <select
                                                value={(message as any).role || "user"}
                                                onChange={(e) => handleMessageChange(index, "role", e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-24"
                                            >
                                                <option value="system">系统</option>
                                                <option value="user">用户</option>
                                                <option value="assistant">助手</option>
                                            </select>
                                            <textarea
                                                value={(message as any).content || ""}
                                                onChange={(e) => handleMessageChange(index, "content", e.target.value)}
                                                placeholder="输入消息内容..."
                                                rows={2}
                                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                            />
                                            {formData.messages.length > 1 && (
                                                <button onClick={() => removeMessage(index)} className="px-3 py-2 text-red-500 hover:text-red-700 transition-colors">
                                                    删除
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 测试按钮 */}
                            <div className="mb-6">
                                <button
                                    onClick={testModel}
                                    disabled={isTesting || !formData.model_name || !formData.token}
                                    className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isTesting ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            测试中...
                                        </>
                                    ) : (
                                        "开始测试"
                                    )}
                                </button>
                            </div>

                            {/* 测试结果 */}
                            {(testResult || streamingResponse) && (
                                <div className="flex-1">
                                    <h3 className="text-md font-medium text-gray-700 mb-4">测试结果</h3>
                                    <div className="bg-gray-50 rounded-lg p-4 h-full overflow-y-auto">
                                        {testResult && (
                                            <div className={`mb-3 text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                                                {testResult.success ? "✓ 测试成功" : `✗ 测试失败: ${testResult.error}`}
                                                {testResult.timestamp && <span className="text-gray-500 ml-2">{new Date(testResult.timestamp).toLocaleString()}</span>}
                                            </div>
                                        )}
                                        {streamingResponse && (
                                            <div className="text-sm text-gray-700 space-y-3">
                                                <div>
                                                    <strong>响应内容:</strong>
                                                    <div className="mt-2 p-3 bg-white rounded border font-mono whitespace-pre-wrap">
                                                        {streamingResponse.data?.content || streamingResponse.content || "无内容"}
                                                    </div>
                                                </div>
                                                {streamingResponse.data?.response_metadata && (
                                                    <div>
                                                        <strong>响应元数据:</strong>
                                                        <div className="mt-2 p-3 bg-white rounded border">
                                                            <div className="space-y-1 text-xs">
                                                                <div>
                                                                    <span className="font-medium">模型提供商:</span> {streamingResponse.data.response_metadata.model_provider}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">模型名称:</span> {streamingResponse.data.response_metadata.model_name}
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">Token 使用:</span> {streamingResponse.data.response_metadata.usage?.total_tokens || 0} (输入:{" "}
                                                                    {streamingResponse.data.response_metadata.usage?.prompt_tokens || 0}, 输出:{" "}
                                                                    {streamingResponse.data.response_metadata.usage?.completion_tokens || 0})
                                                                </div>
                                                                <div>
                                                                    <span className="font-medium">完成原因:</span> {streamingResponse.data.response_metadata.finish_reason}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {streamingResponse.id && (
                                                    <div>
                                                        <strong>响应 ID:</strong>
                                                        <div className="mt-2 p-3 bg-white rounded border font-mono text-xs">{streamingResponse.id}</div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModelTesterPopup;
