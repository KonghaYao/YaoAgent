import React, { useState, useEffect } from "react";
import "./chat.css";
import MessageHuman from "./components/MessageHuman";
import MessageAI from "./components/MessageAI";
import MessageTool from "./components/MessageTool";
import HistoryList from "./components/HistoryList";
import { ChatProvider, useChat } from "./context/ChatContext";
import { ExtraParamsProvider, useExtraParams } from "./context/ExtraParamsContext";
import { UsageMetadata } from "./components/UsageMetadata";
import { formatTime, formatTokens, getMessageContent, Message } from "@langgraph-js/sdk";
import FileList from "./components/FileList";
import JsonEditorPopup from "./components/JsonEditorPopup";

const ChatMessages: React.FC = () => {
    const { renderMessages, loading, inChatError, client, collapsedTools, toggleToolCollapse } = useChat();

    return (
        <div className="chat-messages">
            {renderMessages.map((message) =>
                message.type === "human" ? (
                    <MessageHuman content={message.content} key={message.unique_id} />
                ) : message.type === "tool" ? (
                    <MessageTool
                        key={message.unique_id}
                        message={message}
                        client={client!}
                        getMessageContent={getMessageContent}
                        formatTokens={formatTokens}
                        isCollapsed={collapsedTools.includes(message.id!)}
                        onToggleCollapse={() => toggleToolCollapse(message.id!)}
                    />
                ) : (
                    <MessageAI key={message.unique_id} message={message} />
                )
            )}
            {loading && <div className="loading-indicator">正在思考中...</div>}
            {inChatError && <div className="error-message">{inChatError}</div>}
        </div>
    );
};

const ChatInput: React.FC = () => {
    const { userInput, setUserInput, loading, sendMessage, stopGeneration, currentAgent, setCurrentAgent, client } = useChat();
    const { extraParams } = useExtraParams();
    const [imageUrls, setImageUrls] = useState<string[]>([]);

    const handleFileUploaded = (url: string) => {
        setImageUrls((prev) => [...prev, url]);
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
                    ...imageUrls.map((url) => ({
                        type: "image_url" as const,
                        image_url: { url },
                    })),
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
        <div className="chat-input">
            <div className="chat-input-header">
                <FileList onFileUploaded={handleFileUploaded} />
                <UsageMetadata usage_metadata={client?.tokenCounter || {}} />
                <select value={currentAgent} onChange={(e) => setCurrentAgent(e.target.value)}>
                    {client?.availableAssistants.map((i) => {
                        return (
                            <option value={i.graph_id} key={i.graph_id}>
                                {i.name}
                            </option>
                        );
                    })}
                </select>
            </div>
            <div className="input-container">
                <textarea
                    className="input-textarea"
                    rows={2}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入消息..."
                    disabled={loading}
                />
                <button
                    className={`send-button ${loading ? "interrupt" : ""}`}
                    onClick={() => (loading ? stopGeneration() : sendMultiModalMessage())}
                    disabled={!loading && !userInput.trim() && imageUrls.length === 0}
                >
                    {loading ? "中断" : "发送"}
                </button>
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const { showHistory, toggleHistoryVisible } = useChat();
    const { extraParams, setExtraParams } = useExtraParams();

    return (
        <div className="chat-container">
            {showHistory && <HistoryList onClose={() => toggleHistoryVisible()} formatTime={formatTime} />}
            <div className="chat-main">
                <div className="chat-header">
                    <button onClick={() => setIsPopupOpen(true)} className="edit-params-button">
                        编辑参数
                    </button>
                    <button className="history-button" onClick={() => toggleHistoryVisible()}>
                        历史记录
                    </button>
                    <button
                        className="history-button"
                        onClick={() => {
                            localStorage.setItem("code", "");
                            location.reload();
                        }}
                    >
                        退出登陆
                    </button>
                </div>
                <ChatMessages />
                <ChatInput />
                <JsonEditorPopup isOpen={isPopupOpen} initialJson={extraParams} onClose={() => setIsPopupOpen(false)} onSave={setExtraParams} />
            </div>
        </div>
    );
};

const ChatWrapper: React.FC = () => {
    return (
        <ChatProvider>
            <ExtraParamsProvider>
                <Chat />
            </ExtraParamsProvider>
        </ChatProvider>
    );
};

export default ChatWrapper;
