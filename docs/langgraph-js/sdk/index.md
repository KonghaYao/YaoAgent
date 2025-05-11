# @langgraph-js/sdk 使用指南

@langgraph-js/sdk 提供了一个前端的、框架无关的、基于 LangGraph 生态的强大的前端状态管理工具，具有管理聊天界面、工具调用和历史记录等功能。

支持的前端框架:

- [x] React (示例均为 React)
- [x] Vue

## 安装

使用以下命令安装 SDK：

```sh
pnpm i @langgraph-js/sdk
```

## 特性概述

- **状态管理工具**: 简化与 LangGraph Server 的状态同步
- **聊天界面支持**: 快速构建响应式聊天界面
- **工具调用**: 支持前端工具的注册和调用
- **历史记录管理**: 提供对话历史的存储和检索
- **授权机制**: 支持多种授权方式，包括 Cookie 和自定义令牌
- **实时更新**: 支持流式响应和实时状态更新
- **错误处理**: 内置错误处理和恢复机制
- **框架无关**: 可以与任何前端框架集成

## 创建 LangGraph 客户端绑定

使用 `createChatStore` 函数创建一个 LangGraph 客户端实例：

```ts
import { createChatStore } from "@langgraph-js/sdk";

export const globalChatStore = createChatStore(
    "agent",
    {
        // 自定义与 LangGraph 后端的交互
        apiUrl: "http://localhost:8123",
        // 鉴权请求头等自定义的头可以写在这里
        defaultHeaders: JSON.parse(localStorage.getItem("code") || "{}"),
        callerOptions: {
            // 携带 cookie 的写法
            // fetch(url: string, options: RequestInit) {
            //     options.credentials = "include";
            //     return fetch(url, options);
            // },
        },
    },
    {
        onInit(client) {
            client.tools.bindTools([]);
        },
    }
);
```

## React 组件集成

首先安装 React 绑定:

```sh
pnpm i @nanostores/react
```

在 React 中使用 LangGraph SDK，可以通过上下文 API 来管理状态：

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

### 使用方式

```tsx
export const MyChat = () => {
    return (
        <ChatProvider>
            <ChatComp></ChatComp>
        </ChatProvider>
    );
};

function ChatComp() {
    const chat = useChat();
    
    // 使用chat对象访问各种功能
    // 发送消息
    const sendMessage = () => {
        chat.sendMessage("Hello, LangGraph!");
    };
    
    // 查看历史记录
    const viewHistory = () => {
        console.log(chat.messages);
    };
    
    return (
        <div>
            {/* 聊天界面实现 */}
        </div>
    );
}
```

## 高级功能

### 工具调用

SDK支持注册和调用前端工具，使AI能够与前端交互：

```tsx
// 注册工具
client.tools.bindTools([
    {
        type: "function",
        function: {
            name: "showAlert",
            description: "显示一个警告框",
            parameters: {
                type: "object",
                properties: {
                    message: {
                        type: "string",
                        description: "要显示的消息"
                    }
                },
                required: ["message"]
            }
        },
        handler: (params) => {
            alert(params.message);
            return { success: true };
        }
    }
]);
```

### 持久化

SDK提供了多种持久化选项，详见[持久化文档](./persistence/index.md)：

```tsx
// 保存当前会话
await chat.saveCurrentSession();

// 加载历史会话
await chat.loadSession(sessionId);
```

### 流式响应

支持流式响应，实时更新聊天内容：

```tsx
// 启用流式响应
chat.startStreaming({
    onToken: (token) => {
        // 处理每个接收到的令牌
    },
    onComplete: () => {
        // 流完成后的回调
    }
});
```

## 生成式UI支持

SDK提供了对生成式UI的强大支持，详情请查看[生成式UI文档](./generative-ui/index.md)。

## 主要功能详解

更多详细示例和用法请查看[快速入门指南](./quickstart.md)。

## 与LangGraph生态集成

@langgraph-js/sdk 可以无缝集成 LangGraph 生态系统中的其他组件，包括：

- **@langgraph-js/api**: 通过API接口与服务器通信
- **@langgraph-js/ui**: 使用内置的调试界面
- **@langgraph-js/bundler**: 打包和发布您的LangGraph应用
