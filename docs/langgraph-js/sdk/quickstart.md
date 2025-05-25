# Langgraph UI 快速入门

本文档通过示例介绍 Langgraph UI 的主要功能。

## React Provider

```tsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { globalChatStore } from "../store"; // 改为你的 store 的使用
import { UnionStore, useUnionStore } from "@langgraph-js/sdk";
import { useStore } from "@nanostores/react";

type ChatContextType = UnionStore<typeof globalChatStore>;

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error("useChat must be used within a ChatProvider");
    }
    return context;
};


export const ChatProvider = ({ children }) => {
    // 使用 store 来保证 react 能够响应式地获取状态
    const store = useUnionStore(globalChatStore, useStore);
    
    useEffect(() => {
        // 初始化客户端
        store.initClient().then(() => {
            // 初始化历史对话列表
            store.refreshHistoryList();
        });
    }, [store.currentAgent]);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
```

## 1. 基础配置

```tsx
// 创建 Store 实例
import { createChatStore } from "@langgraph-js/sdk";

const store = createChatStore(
    "agent",  // 代理名称
    {
        apiUrl: "http://localhost:8123",
        defaultHeaders: JSON.parse(localStorage.getItem("code") || "{}"),
    },
    {
        onInit(client) {
            client.tools.bindTools([]);
        },
    }
);

// 在 React 组件中使用
const ChatComponent = () => {
    const { userInput, setUserInput, loading, sendMessage } = useChat();
    
    return (
        <div>
            <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                    }
                }}
            />
            <button onClick={sendMessage} disabled={loading}>
                发送
            </button>
        </div>
    );
};
```

## 2. 工具集成

```tsx
// 创建自定义工具
const fileTool = createToolUI({
    name: "file_operation",
    description: "执行文件操作",
    parameters: [
        {
            name: "filePath",
            type: "string",
            description: "文件路径",
        },
    ],
    async handler(args) {
        return [{ type: "text", text: "执行文件操作 " + args.filePath }];
    },
    // 这个会让整个界面进入loading状态，直到在 UI 界面上调用 tool.response()
    // handler: ToolManager.waitForUIDone,
    // render(tool){
    //     return <div onclick={()=>tool.response("ok")}>确认</div>
    // }
});

// 绑定工具
const store = createChatStore(
    "agent",
    {
        apiUrl: "http://localhost:8123",
    },
    {
        onInit(client) {
            client.tools.bindTools([fileTool]);
        },
    }
);
```

## 3. 历史记录管理

```tsx
// 历史记录组件
const HistoryList = () => {
    const { historyList, currentThread, setCurrentThread } = useChat();

    return (
        <div className="history-list">
            {historyList.map((thread) => (
                <div
                    key={thread.thread_id}
                    className={currentThread?.thread_id === thread.thread_id ? "active" : ""}
                    onClick={() => setCurrentThread(thread)}
                >
                    <div>{thread.messages[0]?.content || "新对话"}</div>
                    <div>{new Date(thread.created_at).toLocaleString()}</div>
                </div>
            ))}
        </div>
    );
};

// 历史记录操作
const createNewThread = async () => {
    await store.createNewThread();
    store.refreshHistoryList();
};

const deleteThread = async (threadId: string) => {
    await store.deleteThread(threadId);
    store.refreshHistoryList();
};
```

## 4. 消息显示

```tsx
// 消息显示组件
const ChatMessages = () => {
    const { renderMessages, loading, inChatError } = useChat();

    return (
        <div className="chat-messages">
            {renderMessages.map((message) => {
                switch (message.type) {
                    case "human":
                        return <MessageHuman content={message.content} />;
                    case "tool":
                        return <MessageTool message={message} />;
                    default:
                        return <MessageAI message={message} />;
                }
            })}
            {loading && <div>正在思考中...</div>}
            {inChatError && <div className="error">{inChatError}</div>}
        </div>
    );
};
```

## 5. 使用量统计

```tsx
// 使用量统计组件
const UsageStats = ({ usage_metadata, spend_time }) => {
    return (
        <div className="usage-stats">
            <div>
                <span>输入: {usage_metadata.input_tokens}</span>
                <span>输出: {usage_metadata.output_tokens}</span>
                <span>总计: {usage_metadata.total_tokens}</span>
            </div>
            <div>耗时: {(spend_time / 1000).toFixed(2)}s</div>
        </div>
    );
};
```
