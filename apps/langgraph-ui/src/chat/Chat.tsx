import React, { useState, useRef, useEffect } from "react";
import { MessagesBox } from "./components/MessageBox";
import HistoryList from "./components/HistoryList";
import { ChatProvider, useChat } from "./context/ChatContext";
import { ExtraParamsProvider, useExtraParams } from "./context/ExtraParamsContext";
import { UsageMetadata } from "./components/UsageMetadata";
import { formatTime, Message } from "@langgraph-js/sdk";
import FileList from "./components/FileList";
import type { SupportedFileType } from "./components/FileList";
import JsonEditorPopup from "./components/JsonEditorPopup";
import { JsonToMessageButton } from "./components/JsonToMessage";
import { GraphPanel } from "../graph/GraphPanel";
import { setLocalConfig } from "./store";
import { History, Network, LogOut, FileJson, Settings, Send } from "lucide-react";
import { ArtifactViewer } from "../artifacts/ArtifactViewer";
import "github-markdown-css/github-markdown.css";
import { ArtifactsProvider, useArtifacts } from "../artifacts/ArtifactsContext";
import "./index.css";
import { show_form } from "./tools/index";
import { create_artifacts } from "./tools/create_artifacts";
import SettingPanel from "../settings/SettingPanel";
import { toast, Toaster } from "../sonner";

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
    const [mediaUrls, setMediaUrls] = useState<Array<any>>([]);
    const [isFileTextMode, setIsFileTextMode] = useState({
        image: false,
        video: false,
        audio: false,
        other: true,
    });
    const handleFileUploaded = (url: string, fileType: SupportedFileType) => {
        // 上传时始终保存原始文件信息，在发送时根据文本模式决定格式
        if (fileType === "image") {
            setMediaUrls((prev) => [...prev, { type: "image_url", image_url: { url }, fileType }]);
        } else if (fileType === "video") {
            setMediaUrls((prev) => [...prev, { type: "video_url", video_url: { url }, fileType }]);
        } else if (fileType === "audio") {
            setMediaUrls((prev) => [...prev, { type: "audio_url", audio_url: { url }, fileType }]);
        } else if (fileType === "other") {
            setMediaUrls((prev) => [...prev, { type: "file_url", file_url: { url }, fileType }]);
        }
    };
    const _setCurrentAgent = (agent: string) => {
        localStorage.setItem("defaultAgent", agent);
        setCurrentAgent(agent);
    };
    const sendMultiModalMessage = () => {
        // 根据文本模式设置处理每个媒体文件
        const processedMediaUrls = mediaUrls.map((media) => {
            const fileType = media.fileType as SupportedFileType;
            if (isFileTextMode[fileType]) {
                // 文本模式：转换为 <file> 标签格式
                const url = media.image_url?.url || media.video_url?.url || media.audio_url?.url || media.file_url?.url;
                return {
                    type: "text",
                    text: `<file type="${fileType}" url="${url}"></file>`,
                };
            } else {
                // 正常模式：保持原始格式
                return media;
            }
        });

        const content: Message[] = [
            {
                type: "human",
                content: [
                    {
                        type: "text",
                        text: userInput,
                    },
                    ...processedMediaUrls,
                ],
            },
        ];
        sendMessage(content, {
            extraParams,
        });

        // 清空媒体文件列表
        setMediaUrls([]);
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMultiModalMessage();
        }
    };

    return (
        <div className="bg-white rounded-2xl px-6 py-5  mb-4 shadow-lg shadow-gray-200">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <FileList onFileUploaded={handleFileUploaded} />
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                        <span>文本模式:</span>
                        <button
                            onClick={() => setIsFileTextMode((prev) => ({ ...prev, image: !prev.image }))}
                            className={`px-2 py-1 rounded ${isFileTextMode.image ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                        >
                            图片
                        </button>
                        <button
                            onClick={() => setIsFileTextMode((prev) => ({ ...prev, video: !prev.video }))}
                            className={`px-2 py-1 rounded ${isFileTextMode.video ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                        >
                            视频
                        </button>
                        <button
                            onClick={() => setIsFileTextMode((prev) => ({ ...prev, audio: !prev.audio }))}
                            className={`px-2 py-1 rounded ${isFileTextMode.audio ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                        >
                            音频
                        </button>
                        <button
                            onClick={() => setIsFileTextMode((prev) => ({ ...prev, other: !prev.other }))}
                            className={`px-2 py-1 rounded ${isFileTextMode.other ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                        >
                            其他
                        </button>
                    </div>
                </div>

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
                    className="flex-1 px-5 py-4 text-base bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-inner placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-none active:outline-none focus:outline-none"
                    rows={3}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="请输入消息内容…"
                    disabled={loading}
                    style={{
                        minHeight: "48px",
                        maxHeight: "120px",
                        lineHeight: "1.7",
                        fontFamily: "inherit",
                    }}
                />
                <button
                    className={`px-4 py-3 text-sm font-medium text-white rounded-xl focus:outline-none transition-colors flex items-center justify-center ${
                        loading ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                    onClick={() => (loading ? stopGeneration() : sendMultiModalMessage())}
                    disabled={!loading && !userInput.trim() && mediaUrls.length === 0}
                >
                    {loading ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>
            <div className="flex mt-4 gap-2 justify-between items-center">
                <UsageMetadata usage_metadata={client?.tokenCounter || {}} />
                {!!currentChatId && <span className="text-xs text-gray-400 dark:text-gray-500">会话 ID: {currentChatId}</span>}
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
        <div className="langgraph-chat-container flex h-full w-full overflow-hidden bg-gray-100">
            {showHistory && (
                <div className="p-4">
                    <HistoryList onClose={() => toggleHistoryVisible()} />
                </div>
            )}
            <section className="flex-1 flex flex-col overflow-auto items-center ">
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
                        额外参数
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
                            toast.info("数据已打印到控制台，请 F12 查看");
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
                <JsonEditorPopup
                    isOpen={isPopupOpen}
                    initialJson={extraParams}
                    onClose={() => setIsPopupOpen(false)}
                    onSave={setExtraParams}
                    title="编辑额外参数"
                    description="额外参数用于在发送消息时附加到 LangGraph 的 State 中。"
                />
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
