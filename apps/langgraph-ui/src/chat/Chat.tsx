import React, { useState, useRef, useEffect } from "react";
import { MessagesBox } from "./components/MessageBox";
import HistoryList from "./components/HistoryList";
import { ChatProvider, useChat } from "./context/ChatContext";
import { ExtraParamsProvider, useExtraParams } from "./context/ExtraParamsContext";
import { UsageMetadata } from "./components/UsageMetadata";
import { formatTime, Message } from "@langgraph-js/sdk";
import FileList from "./components/FileList";
import JsonEditorPopup from "./components/JsonEditorPopup";
import { JsonToMessageButton } from "./components/JsonToMessage";
import { GraphPanel } from "../graph/GraphPanel";
import { setLocalConfig } from "./store";
import { History, Network, LogOut, FileJson } from "lucide-react";
import { ArtifactViewer } from "../artifacts/ArtifactViewer";
import "github-markdown-css/github-markdown.css";
import { ArtifactsProvider, useArtifacts } from "../artifacts/ArtifactsContext";
import "./index.css";
import { show_form } from "./tools/index";
import { create_artifacts } from "./tools/create_artifacts";

const ChatMessages: React.FC = () => {
    const { renderMessages, loading, inChatError, client, collapsedTools, toggleToolCollapse, isFELocking } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const MessageContainer = useRef<HTMLDivElement>(null);

    // 检查是否足够接近底部（距离底部 30% 以内）
    const isNearBottom = () => {
        if (!MessageContainer.current) return false;

        const container = MessageContainer.current;
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;

        return scrollHeight - scrollPosition <= 50;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    };

    useEffect(() => {
        if (renderMessages.length > 0 && MessageContainer.current) {
            // 切换消息时，自动滚动到底部
            if (!loading) {
                scrollToBottom();
            }
            // 只有当用户已经滚动到接近底部时，才自动滚动到底部
            if (loading && isNearBottom()) {
                scrollToBottom();
            }
        }
    }, [renderMessages]);

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4" ref={MessageContainer}>
            <MessagesBox renderMessages={renderMessages} collapsedTools={collapsedTools} toggleToolCollapse={toggleToolCollapse} client={client!} />
            {/* {isFELocking() && <div className="flex items-center justify-center py-4 text-gray-500">请你继续操作</div>} */}
            {loading && !isFELocking() && (
                <div className="flex items-center justify-center py-4 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                    正在思考中...
                </div>
            )}
            {inChatError && <div className="p-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">{JSON.stringify(inChatError)}</div>}
            <div ref={messagesEndRef} />
        </div>
    );
};

const ChatInput: React.FC = () => {
    const { userInput, setUserInput, loading, sendMessage, stopGeneration, currentAgent, setCurrentAgent, client, currentChatId } = useChat();
    const { extraParams } = useExtraParams();
    const [imageUrls, setImageUrls] = useState<{ type: "image_url"; image_url: { url: string } }[]>([]);
    const handleFileUploaded = (url: string) => {
        setImageUrls((prev) => [...prev, { type: "image_url", image_url: { url } }]);
    };
    const _setCurrentAgent = (agent: string) => {
        localStorage.setItem("agent_name", agent);
        setCurrentAgent(agent);
    };
    const sendMultiModalMessage = () => {
        const content: Message[] = [
            {
                type: "human",
                content: [
                    {
                        type: "text",
                        text: userInput,
                    },
                    ...imageUrls,
                ],
            },
        ];
        sendMessage(content, {
            extraParams,
        });

        // 清空图片列表
        setImageUrls([]);
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMultiModalMessage();
        }
    };

    return (
        <div className="border-t border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <FileList onFileUploaded={handleFileUploaded} />

                <select
                    value={currentAgent}
                    onChange={(e) => _setCurrentAgent(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    {client?.availableAssistants.map((i) => {
                        return (
                            <option value={i.graph_id} key={i.graph_id}>
                                {i.name}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="flex gap-2">
                <textarea
                    className="flex-1 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={2}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入消息..."
                    disabled={loading}
                />
                <button
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        loading ? "bg-red-500 hover:bg-red-600 focus:ring-red-500" : "bg-blue-500 hover:bg-blue-600 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    }`}
                    onClick={() => (loading ? stopGeneration() : sendMultiModalMessage())}
                    disabled={!loading && !userInput.trim() && imageUrls.length === 0}
                >
                    {loading ? "中断" : "发送"}
                </button>
            </div>
            <div className="flex border-b border-gray-200 mt-4 gap-2 justify-between">
                <UsageMetadata usage_metadata={client?.tokenCounter || {}} />
                <span className="text-sm text-gray-500">会话 ID: {currentChatId}</span>
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const { showHistory, toggleHistoryVisible, showGraph, toggleGraphVisible, renderMessages, setTools, client } = useChat();
    const { extraParams, setExtraParams } = useExtraParams();
    const { showArtifact, setShowArtifact } = useArtifacts();

    useEffect(() => {
        setTools([show_form, create_artifacts]);
    }, []);
    return (
        <div className="langgraph-chat-container flex h-full w-full overflow-hidden">
            {showHistory && <HistoryList onClose={() => toggleHistoryVisible()} formatTime={formatTime} />}
            <div className="flex-1 flex flex-col overflow-auto">
                <div className="flex items-center gap-2 p-4 border-b border-gray-200 justify-end h-16">
                    <button
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1.5"
                        onClick={() => {
                            toggleHistoryVisible();
                            setLocalConfig({ showHistory: !showHistory });
                        }}
                    >
                        <History className="w-4 h-4" />
                        历史记录
                    </button>
                    <div className="flex-1"></div>

                    <button
                        onClick={() => setIsPopupOpen(true)}
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1.5"
                    >
                        <FileJson className="w-4 h-4" />
                        编辑参数
                    </button>

                    <button
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1.5"
                        onClick={() => {
                            console.log(renderMessages);
                        }}
                    >
                        打印日志数据
                    </button>
                    <button
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1.5"
                        onClick={() => {
                            console.log(client?.graphState);
                        }}
                    >
                        打印 State
                    </button>
                    <button
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1.5"
                        onClick={() => {
                            toggleGraphVisible();
                            setLocalConfig({ showGraph: !showGraph });
                        }}
                    >
                        <Network className="w-4 h-4" />
                        节点图
                    </button>
                    <button
                        className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1.5"
                        onClick={() => {
                            localStorage.setItem("code", "");
                            location.reload();
                        }}
                    >
                        <LogOut className="w-4 h-4" />
                        退出登陆
                    </button>
                </div>
                <ChatMessages />
                <ChatInput />
                <JsonEditorPopup isOpen={isPopupOpen} initialJson={extraParams} onClose={() => setIsPopupOpen(false)} onSave={setExtraParams} />
            </div>
            {(showGraph || showArtifact) && (
                <div className="overflow-hidden flex-1">
                    {showGraph && <GraphPanel />}
                    {showArtifact && <ArtifactViewer />}
                </div>
            )}
        </div>
    );
};

const ChatWrapper: React.FC = () => {
    return (
        <ChatProvider>
            <ExtraParamsProvider>
                <ArtifactsProvider>
                    <Chat />
                </ArtifactsProvider>
            </ExtraParamsProvider>
        </ChatProvider>
    );
};

export default ChatWrapper;
