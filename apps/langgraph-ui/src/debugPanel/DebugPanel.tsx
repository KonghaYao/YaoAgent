import React, { useState, useRef, useEffect } from "react";
import { ChatProvider, useChat } from "@langgraph-js/sdk/react";
import { Message } from "@langgraph-js/sdk";
import { Send, Bug, Bot, Plus, Trash } from "lucide-react";
import { toast } from "sonner";
import { useDebugPanel } from "./Context";
import ModelTesterPopup from "../chat/components/ModelTesterPopup";
import { MessagesBox } from "../chat/components/MessageBox";
import { ExtraParamsProvider } from "@/chat/context/ExtraParamsContext";

const DebugMessages: React.FC = () => {
    const { renderMessages, loading, inChatError, client } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    };

    useEffect(() => {
        if (renderMessages.length > 0 && !loading) {
            scrollToBottom();
        }
    }, [renderMessages, loading]);

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-gray-50 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-300 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-gray-400">
            {renderMessages.length === 0 && !loading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="flex items-center justify-center">
                            <div className="text-4xl mb-4">🐛</div>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-700 mb-2">Debug Panel</h1>
                        <div className="text-sm text-gray-500">调试助手控制台</div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-5 w-full">
                    <MessagesBox renderMessages={renderMessages} collapsedTools={[]} toggleToolCollapse={() => {}} client={client!} />
                </div>
            )}
            {loading && (
                <div className="flex items-center justify-center py-4 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                    调试中...
                </div>
            )}
            {inChatError && <div className="px-4 py-3 text-sm text-red-600 bg-red-50 rounded-lg">{JSON.stringify(inChatError)}</div>}
            <div ref={messagesEndRef} />
        </div>
    );
};

const DebugInput: React.FC = () => {
    const { userInput, setUserInput, loading, sendMessage, stopGeneration, createNewChat, renderMessages } = useChat();
    const { messagesContext } = useDebugPanel();
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const sendDebugMessage = () => {
        const item = localStorage.getItem("model-tester-config");
        if (!item) {
            toast.error("请先配置模型测试器");
            return;
        }

        let config;
        try {
            config = JSON.parse(item);
        } catch (error) {
            toast.error("模型测试器配置格式错误，请重新配置");
            console.error("Failed to parse model-tester-config:", error);
            return;
        }

        // 验证配置对象的有效性
        if (!config || typeof config !== "object") {
            toast.error("模型测试器配置无效，请重新配置");
            return;
        }

        // 检查必要的配置项
        if (!config.token || typeof config.token !== "string" || config.token.trim() === "") {
            toast.error("API Token 未配置或为空，请检查模型测试器配置");
            return;
        }
        const isFirstMessage = renderMessages.length === 0;
        const content: Message[] = [
            {
                type: "human",
                content: userInput,
            },
        ];
        if (isFirstMessage && messagesContext)
            content.push({
                type: "human",
                content: "这些是我们的数据\n\n" + messagesContext,
            });
        sendMessage(content, {
            extraParams: {
                model_name: config.model_name || "qwen-plus",
                api_key: config.token.trim(),
                api_host: config.base_url,
            },
        });
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendDebugMessage();
        }
    };

    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        if (userInput && (userInput.length > 50 || userInput.includes("\n"))) {
            setIsExpanded(true);
        } else {
            setIsExpanded(false);
        }
    }, [userInput]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            if (isExpanded) {
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 96) + "px";
            }
        }
    }, [userInput, isExpanded]);

    return (
        <div className="p-4 bg-white border-t border-gray-200">
            <div className={`bg-gray-50 border border-gray-200 rounded-lg px-3 py-3 ${isExpanded ? "rounded-xl" : "rounded-full"}`}>
                <div className={`flex gap-3 ${isExpanded ? "items-end" : "items-center"}`}>
                    <button
                        onClick={() => createNewChat()}
                        className="w-8 h-8 flex items-center justify-center rounded-full focus:outline-none transition-colors bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40"
                        title="创建新对话"
                    >
                        <Trash className="w-4 h-4" />
                    </button>
                    <textarea
                        ref={textareaRef}
                        className="flex-1 text-sm resize-none active:outline-none focus:outline-none bg-transparent"
                        rows={1}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="输入调试命令..."
                        disabled={loading}
                        style={{
                            maxHeight: isExpanded ? "6rem" : "2rem",
                            fontFamily: "inherit",
                            lineHeight: isExpanded ? "inherit" : "2rem",
                        }}
                    />
                    <button
                        className={`w-8 h-8 flex items-center justify-center rounded-full focus:outline-none transition-colors disabled:cursor-not-allowed ${
                            loading ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40"
                        }`}
                        onClick={() => (loading ? stopGeneration() : sendDebugMessage())}
                        disabled={!loading && !userInput.trim()}
                    >
                        {loading ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const DebugPanel: React.FC = () => {
    const [isModelTesterOpen, setIsModelTesterOpen] = useState(false);

    return (
        <div className="flex h-full w-full max-w-xl overflow-hidden bg-gray-50">
            <section className="flex-1 flex flex-col overflow-hidden">
                <header className="flex items-center gap-2 px-4 py-3 justify-between bg-white border-b border-gray-200">
                    <div className="flex items-center gap-2">
                        <Bug className="w-5 h-5 text-gray-600" />
                        <h1 className="text-lg font-semibold text-gray-900">调试面板</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsModelTesterOpen(true)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                        >
                            <Bot className="w-4 h-4" />
                            模型测试器
                        </button>
                    </div>
                </header>
                <main className="flex-1 overflow-hidden flex flex-col">
                    <DebugMessages />
                    <DebugInput />
                </main>
                <ModelTesterPopup isOpen={isModelTesterOpen} onClose={() => setIsModelTesterOpen(false)} />
            </section>
        </div>
    );
};

const DebugPanelWrapper: React.FC = () => {
    const { isDebugPanelVisible } = useDebugPanel();
    if (!isDebugPanelVisible) {
        return null;
    }
    return (
        <ChatProvider
            defaultAgent={"graph"}
            apiUrl={new URL("/api/open-smith/graph", window.location.origin.toString()).href}
            defaultHeaders={{}}
            withCredentials={false}
            showHistory={false}
            fallbackToAvailableAssistants={false}
            onInitError={(err, currentAgent) => {
                toast.error("调试面板连接失败: " + currentAgent + "\n" + err, {
                    duration: 5000,
                });
            }}
        >
            <ExtraParamsProvider>
                <DebugPanel />
            </ExtraParamsProvider>
        </ChatProvider>
    );
};

export default DebugPanelWrapper;
