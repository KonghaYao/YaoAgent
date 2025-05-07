# @langgraph-js/sdk 使用指南

@langgraph-js/sdk 提供了一个前端的、框架无关的、基于 Langgraph 生态的强大的前端状态管理工具，具有管理聊天界面、工具调用和历史记录等功能。

- [x] React (示例均为 React)
- [x] Vue

## 安装

使用以下命令安装 SDK：

```sh
pnpm i @langgraph-js/sdk
```

## 创建 Langgraph 客户端绑定

使用 `createChatStore` 函数创建一个 Langgraph 客户端实例：

```ts
import { createChatStore } from "@langgraph-js/sdk";

export const globalChatStore = createChatStore(
    "agent",
    {
        // 自定义与 Langgraph 后端的交互
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

## React 组件

```sh
pnpm i @nanostores/react
```

在 React 中使用 Langgraph SDK，可以通过上下文 API 来管理状态：

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
function ChatComp(){
    const chat = useChat()
}
```

## 主要功能

更多示例请查看 [快速入门指南](./quickstart.md)
