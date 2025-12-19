import React, { useState, useRef, useEffect } from "react";
import { MessagesBox } from "./components/MessageBox";
import HistoryList from "./components/HistoryList";
import { ChatProvider, useChat } from "@langgraph-js/sdk/react";
import { ExtraParamsProvider, useExtraParams } from "./context/ExtraParamsContext";
import { UsageMetadata } from "./components/UsageMetadata";
import { createLowerJSClient, Message } from "@langgraph-js/sdk";
import FileList from "./components/FileList";
import { FileListProvider, useFileList } from "./components/FileListContext";
import type { SupportedFileType } from "./components/FileList";
import JsonEditorPopup from "./components/JsonEditorPopup";
import { GraphPanel } from "../graph/GraphPanel";
import { setLocalConfig } from "./store";
import { History, Network, FileJson, Settings, Send, UploadCloudIcon, GitBranch, TestTube, Terminal, Printer, BotIcon, Bug } from "lucide-react";
import { ArtifactViewer } from "../artifacts/ArtifactViewer";
import "github-markdown-css/github-markdown.css";

import "./index.css";
import { default_tools } from "./tools/index";
import SettingPanel from "../settings/SettingPanel";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

import { MonitorProvider, Monitor, useMonitor } from "../monitor";
import UploadButton from "./components/UploadButton";

import DebugPanel from "../debugPanel/DebugPanel";
import { useDebugPanel } from "../debugPanel/Context";
import InterruptPanel from "./components/InterruptPanel";

const ChatMessages: React.FC = () => {
    const { renderMessages, loading, inChatError, client, collapsedTools, toggleToolCollapse, isFELocking } = useChat();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const MessageContainer = useRef<HTMLDivElement>(null);
    const { setMessagesContext } = useDebugPanel();
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" });
    };

    useEffect(() => {
        const container = MessageContainer.current;
        if (!container) return;
        const observer = new ResizeObserver(() => {
            if (container.scrollHeight - container.scrollTop - container.clientHeight < 100) {
                scrollToBottom();
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (renderMessages.length > 0 && MessageContainer.current) {
            // 切换消息时，自动滚动到底部
            if (!loading) {
                scrollToBottom();
            }
            setMessagesContext(renderMessages);
        }
    }, [renderMessages]);

    return (
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 bg-gray-100" ref={MessageContainer}>
            {renderMessages.length === 0 && !loading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <div className="flex items-center justify-center">
                            <div className="text-6xl mb-4 w-24 h-24 border border-green-300 rounded-full p-4 bg-green-100">🦜</div>
                        </div>
                        <h1 className="text-4xl font-bold text-gray-700 mb-2">LangGraph Console</h1>
                        <div className="text-lg text-gray-500">AI 助手控制台</div>
                    </div>
                </div>
            ) : (
                <MessagesBox renderMessages={renderMessages} />
            )}
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
    const { userInput, renderMessages, setUserInput, loading, sendMessage, stopGeneration, currentAgent, setCurrentAgent, client, currentChatId } = useChat();
    const { extraParams } = useExtraParams();
    const monitor = useMonitor();
    const { mediaUrls, isFileTextMode, setIsFileTextMode } = useFileList();
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
                    ...(processedMediaUrls as any),
                ],
            },
        ];
        sendMessage(content, {
            extraParams,
        });
    };

    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMultiModalMessage();
        }
    };

    const [usingSingleMode, setUsingSingleMode] = useState(true);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (mediaUrls.length > 0 || (userInput && (userInput.length > 50 || userInput.includes("\n")))) {
            setUsingSingleMode(false);
        } else {
            setUsingSingleMode(true);
        }
    }, [renderMessages.length, mediaUrls.length, userInput]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            if (!usingSingleMode) {
                textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 96) + "px";
            }
        }
    }, [userInput, usingSingleMode]);

    return (
        <div className=" pb-8 ">
            <div className={"bg-white border border-gray-200 shadow-lg shadow-gray-200 " + (usingSingleMode ? "rounded-full px-3 py-3" : "rounded-[2rem] px-4 py-3")}>
                {!usingSingleMode && mediaUrls.length > 0 && (
                    <div className="flex items-center justify-between mb-2 border-b border-gray-200 pb-2">
                        <FileList />
                    </div>
                )}
                <div className={`flex gap-3 ${usingSingleMode ? "items-center" : "items-end"}`}>
                    <UploadButton />
                    <textarea
                        ref={textareaRef}
                        className={`flex-1 text-sm resize-none active:outline-none focus:outline-none ${usingSingleMode ? "" : "py-2"}`}
                        rows={1}
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder={usingSingleMode ? "请输入消息内容…" : "请输入消息内容…"}
                        disabled={loading}
                        style={{
                            maxHeight: usingSingleMode ? "2rem" : "6rem",
                            fontFamily: "inherit",
                            lineHeight: usingSingleMode ? "2rem" : "inherit",
                        }}
                    />
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
                    <button
                        className={`w-8 h-8 flex items-center justify-center rounded-full focus:outline-none transition-colors ${
                            loading ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
                        }`}
                        onClick={() => (loading ? stopGeneration() : sendMultiModalMessage())}
                        disabled={!loading && !userInput.trim() && mediaUrls.length === 0}
                    >
                        {loading ? (
                            <svg className={"w-4 h-4"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <Send className={"w-4 h-4"} />
                        )}
                    </button>
                </div>
            </div>

            <div className={"flex gap-2 px-8 pt-4 justify-between items-center " + (renderMessages.length ? "opacity-100" : "opacity-0")}>
                <UsageMetadata usage_metadata={client?.tokenCounter || {}} />
                <div className="flex items-center gap-2">
                    {!!currentChatId && (
                        <span className="cursor-pointer text-xs text-gray-300 dark:text-gray-500" onClick={() => monitor?.openMonitorWithChat(currentChatId)}>
                            会话 ID: {currentChatId}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { showHistory, toggleHistoryVisible, showGraph, toggleGraphVisible, renderMessages, setTools, client } = useChat();
    const { extraParams, setExtraParams } = useExtraParams();
    const { showArtifact, sendMessage } = useChat();
    const monitor = useMonitor();
    const { toggleDebugPanel, isDebugPanelVisible } = useDebugPanel();
    useEffect(() => {
        setTools(default_tools);
    }, []);
    return (
        <div className="langgraph-chat-container flex h-full w-full overflow-hidden bg-gray-100">
            {showHistory && (
                <div className="border-r border-gray-200 min-w-64">
                    <HistoryList onClose={() => toggleHistoryVisible()} />
                </div>
            )}
            <section className="flex-1 flex flex-col overflow-hidden items-center ">
                <header className="flex items-center gap-2 px-3 py-2 justify-end h-16 mt-4  max-w-6xl w-full">
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
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
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                    >
                        <FileJson className="w-4 h-4" />
                        额外参数
                    </button>

                    <button
                        id="setting-button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        设置
                    </button>
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                        onClick={() => {
                            toast.info("数据已打印到控制台，请 F12 查看");
                            console.log(client?.graphState);
                        }}
                    >
                        <Printer className="w-4 h-4" />
                        打印 State
                    </button>

                    {/* <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                        onClick={() => {
                            toggleGraphVisible();
                            setLocalConfig({ showGraph: !showGraph });
                        }}
                    >
                        <GitBranch className="w-4 h-4" />
                        节点图
                    </button> */}
                    <button
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 cursor-pointer rounded-xl hover:bg-gray-100 focus:outline-none transition-colors flex items-center gap-2"
                        onClick={() => {
                            monitor?.openMonitor("/api/open-smith/ui/index.html");
                        }}
                    >
                        <Terminal className="w-4 h-4" />
                        控制台
                    </button>
                    <button
                        onClick={toggleDebugPanel}
                        className={`px-4 py-2 text-sm font-medium cursor-pointer rounded-xl focus:outline-none transition-colors flex items-center gap-2 ${
                            isDebugPanelVisible ? "text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100" : "text-gray-700 bg-white border border-gray-200 hover:bg-gray-100"
                        }`}
                    >
                        <Bug className="w-4 h-4" />
                        调试面板
                    </button>
                </header>
                <main className="flex-1 overflow-hidden max-w-6xl w-full h-full  flex flex-col">
                    <ChatMessages />
                    <div className="flex flex-col">
                        <InterruptPanel />
                        <FileListProvider>
                            <ChatInput />
                        </FileListProvider>
                    </div>
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
                    {showArtifact && (
                        <ArtifactViewer
                            onSendBackToAI={(errorData) => {
                                sendMessage(
                                    [
                                        {
                                            type: "human",
                                            content: [
                                                {
                                                    type: "text",
                                                    text: `
error react file: 
- filename: ${errorData.groupId} 
- version: ${errorData.versionId} 
                    
${errorData.error}`,
                                                },
                                            ],
                                        },
                                    ],
                                    { extraParams }
                                );
                            }}
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const ChatWrapper: React.FC = () => {
    // 从 localStorage 读取配置数据
    const getLocalStorageData = () => {
        try {
            const storedHeaders = localStorage.getItem("code");
            const storedWithCredentials = localStorage.getItem("withCredentials");
            const storedApiUrl = localStorage.getItem("apiUrl");
            const storedDefaultAgent = localStorage.getItem("defaultAgent");
            const storedShowHistory = localStorage.getItem("showHistory");
            const storedShowGraph = localStorage.getItem("showGraph");

            // 处理请求头
            let defaultHeaders: Record<string, string> = {};
            if (storedHeaders) {
                const parsedHeaders = JSON.parse(storedHeaders);
                if (Array.isArray(parsedHeaders)) {
                    defaultHeaders = Object.fromEntries(parsedHeaders.map((item: { key: string; value: string }) => [item.key, item.value]));
                } else if (typeof parsedHeaders === "object") {
                    defaultHeaders = parsedHeaders;
                }
            }
            const apiUrl = storedApiUrl?.startsWith("/") ? new URL(storedApiUrl, window.location.origin).toString() : storedApiUrl;
            return {
                defaultAgent: storedDefaultAgent || "",
                apiUrl: apiUrl || "http://localhost:8123",
                defaultHeaders,
                withCredentials: storedWithCredentials === "true",
                showHistory: storedShowHistory === "true",
                showGraph: storedShowGraph === "true",
            };
        } catch (error) {
            console.error("Error reading config from localStorage:", error);
            return {
                defaultAgent: "",
                apiUrl: "http://localhost:8123",
                defaultHeaders: {},
                withCredentials: false,
                showHistory: false,
                showGraph: false,
            };
        }
    };

    const config = getLocalStorageData();

    return (
        <MonitorProvider>
            <ChatProvider
                defaultAgent={config.defaultAgent}
                apiUrl={config.apiUrl}
                defaultHeaders={config.defaultHeaders}
                withCredentials={config.withCredentials}
                showHistory={config.showHistory}
                showGraph={config.showGraph}
                fallbackToAvailableAssistants={true}
                // client={createLowerJSClient({
                //     apiUrl: config.apiUrl,
                //     defaultHeaders: config.defaultHeaders,
                //     callerOptions: {
                //         fetch: config.withCredentials
                //             ? (url: string, options: RequestInit) => {
                //                   options.credentials = "include";
                //                   return fetch(url, options);
                //               }
                //             : fetch,
                //     },
                // })}
                // legacyMode={true}
                onInitError={(err, currentAgent) => {
                    // 默认错误处理
                    toast.error("请检查服务器配置: " + currentAgent + "\n" + err, {
                        duration: 10000,
                        action: {
                            label: "去设置",
                            onClick: () => {
                                document.getElementById("setting-button")?.click();
                                setTimeout(() => {
                                    document.getElementById("server-login-button")?.click();
                                }, 300);
                            },
                        },
                    });
                }}
            >
                <ExtraParamsProvider>
                    <Chat />
                    <Toaster />
                    <Monitor />
                </ExtraParamsProvider>
            </ChatProvider>
        </MonitorProvider>
    );
};

export default ChatWrapper;
