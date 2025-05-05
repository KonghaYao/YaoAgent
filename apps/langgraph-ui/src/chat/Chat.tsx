import React from "react";
import "./chat.css";
import MessageHuman from "./components/MessageHuman";
import MessageAI from "./components/MessageAI";
import MessageTool from "./components/MessageTool";
import HistoryList from "./components/HistoryList";
import { ChatProvider, useChat } from "./context/ChatContext";
import { HistoryProvider } from "./context/HistoryContext";
import { UsageMetadata } from "./components/UsageMetadata";

const ChatMessages: React.FC = () => {
    const { messages, loading, error, client, collapsedTools, toggleToolCollapse, getMessageContent, formatTokens } = useChat();

    return (
        <div className="chat-messages">
            {messages.map((message) =>
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
                    <MessageAI key={message.unique_id} message={message} getMessageContent={getMessageContent} />
                )
            )}
            {loading && <div className="loading-indicator">正在思考中...</div>}
            {error && <div className="error-message">{error}</div>}
        </div>
    );
};

const ChatInput: React.FC = () => {
    const { input, setInput, loading, sendMessage, interruptMessage, currentAgent, setCurrentAgent, client } = useChat();
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-input">
            <div className="chat-input-header">
                <select value={currentAgent} onChange={(e) => setCurrentAgent(e.target.value)}>
                    {client?.availableAssistants.map((i) => {
                        return <option value={i.assistant_id}>{i.name}</option>;
                    })}
                </select>
                <UsageMetadata usage_metadata={client?.tokenCounter || {}} />
            </div>
            <div className="input-container">
                <textarea className="input-textarea" rows={2} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyPress} placeholder="输入消息..." disabled={loading} />
                <button className={`send-button ${loading ? "interrupt" : ""}`} onClick={() => (loading ? interruptMessage() : sendMessage())} disabled={!loading && !input.trim()}>
                    {loading ? "中断" : "发送"}
                </button>
            </div>
        </div>
    );
};

const Chat: React.FC = () => {
    const { showHistory, toggleHistory, formatTime } = useChat();

    return (
        <div className="chat-container">
            {showHistory && <HistoryList onClose={() => toggleHistory()} formatTime={formatTime} />}
            <div className="chat-main">
                <div className="chat-header">
                    <button className="history-button" onClick={() => toggleHistory()}>
                        历史记录
                    </button>
                </div>
                <ChatMessages />
                <ChatInput />
            </div>
        </div>
    );
};

const ChatWrapper: React.FC = () => {
    return (
        <ChatProvider>
            <HistoryProvider>
                <Chat />
            </HistoryProvider>
        </ChatProvider>
    );
};

export default ChatWrapper;
