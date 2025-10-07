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
import { History, Network, LogOut, FileJson, Settings } from "lucide-react";
import { ArtifactViewer } from "../artifacts/ArtifactViewer";
import "github-markdown-css/github-markdown.css";
import { ArtifactsProvider, useArtifacts } from "../artifacts/ArtifactsContext";
import "./index.css";
import { show_form } from "./tools/index";
import { create_artifacts } from "./tools/create_artifacts";
import SettingPanel from "../settings/SettingPanel";
import { Toaster } from "../sonner";

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
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-100" ref={MessageContainer}>
            <MessagesBox renderMessages={renderMessages} collapsedTools={collapsedTools} toggleToolCollapse={toggleToolCollapse} client={client!} />
            {/* {isFELocking() && <div className="flex items-center justify-center py-4 text-gray-500">请你继续操作</div>} */}
            {loading && !isFELocking() && (
                <div className="flex items-center justify-center py-6 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent mr-2"></div>
                    正在思考中...
                </div>
            )}
            {inChatError && <div className="px-4 py-3 text-sm text-red-600 bg-white rounded-xl">{JSON.stringify(inChatError)}</div>}
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
        localStorage.setItem("defaultAgent", agent);
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
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl px-6 py-5">
            <div className="flex items-center justify-between mb-4">
                <FileList onFileUploaded={handleFileUploaded} />

                <select
                    value={currentAgent}
                    onChange={(e) => _setCurrentAgent(e.target.value)}
                    className="px-4 py-2 text-sm bg-white/60 dark:bg-gray-800/60 rounded-xl focus:outline-none transition-colors"
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
            <div className="flex gap-3">
                <textarea
                    className="flex-1 px-4 py-3 text-sm bg-white/60 dark:bg-gray-800/60 rounded-xl focus:outline-none focus:bg-white/80 dark:focus:bg-gray-800/80 resize-none transition-colors placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    rows={2}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入消息..."
                    disabled={loading}
                />
                <button
                    className={`px-6 py-3 text-sm font-medium text-white rounded-xl focus:outline-none transition-colors ${
                        loading ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                    onClick={() => (loading ? stopGeneration() : sendMultiModalMessage())}
                    disabled={!loading && !userInput.trim() && imageUrls.length === 0}
                >
                    {loading ? "中断" : "发送"}
                </button>
            </div>
            <div className="flex mt-4 gap-2 justify-between items-center">
                <UsageMetadata usage_metadata={client?.tokenCounter || {}} />
                <span className="text-xs text-gray-400 dark:text-gray-500">会话 ID: {currentChatId}</span>
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { showHistory, toggleHistoryVisible, showGraph, toggleGraphVisible, renderMessages, setTools, client } = useChat();
    const { extraParams, setExtraParams } = useExtraParams();
    const { showArtifact, setShowArtifact } = useArtifacts();

    useEffect(() => {
        setTools([show_form, create_artifacts]);
    }, []);
    return (
        <div className="langgraph-chat-container flex h-full w-full overflow-hidden ">
            {showHistory && <HistoryList onClose={() => toggleHistoryVisible()} formatTime={formatTime} />}
            <section className="flex-1 flex flex-col overflow-auto items-center bg-gray-100">
                <header className="flex items-center gap-2 px-6 py-4 bg-white/50 backdrop-blur-sm justify-end h-16 mt-4 rounded-2xl shadow-lg shadow-gray-200">
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
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
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                    >
                        <FileJson className="w-4 h-4" />
                        编辑参数
                    </button>
                    <button
                        id="setting-button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        设置
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                        onClick={() => {
                            console.log(client?.graphState);
                        }}
                    >
                        打印 State
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                        onClick={() => {
                            toggleGraphVisible();
                            setLocalConfig({ showGraph: !showGraph });
                        }}
                    >
                        <Network className="w-4 h-4" />
                        节点图
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto overflow-x-hidden max-w-6xl w-full h-full  flex flex-col">
                    <ChatMessages />
                    <ChatInput />
                </main>
                <JsonEditorPopup isOpen={isPopupOpen} initialJson={extraParams} onClose={() => setIsPopupOpen(false)} onSave={setExtraParams} />
                <SettingPanel isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            </section>
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
                    <Toaster />
                </ArtifactsProvider>
            </ExtraParamsProvider>
        </ChatProvider>
    );
};

export default ChatWrapper;
