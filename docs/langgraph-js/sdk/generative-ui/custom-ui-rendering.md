# 自定义 UI 渲染

@langgraph-js/sdk 提供了完全自由的 UI 界面定义功能，让您能够按照个人喜好设计对话组件样式。

## 总体渲染结构图

```txt
+-----------------+
|   ChatWrapper   |
+-----------------+
        |
+-----------------+
|      Chat       |
+-----------------+
        |
+------------------------+
|         ChatMain       |
+------------------------+
    |                    |
    v                    v
+-----------------+  +-----------------+
|  ChatMessages   |  |    ChatInput    |
+-----------------+  +-----------------+
  |      |     |        |           |
  v      v     v        v           v
+-----+ +--+ +----+ +-----------+ +-----------+
|Human| |AI| |Tool| | userInput | | 发送/中断 |
+-----+ +--+ +----+ +-----------+ +-----------+
|__________________|
          |
          v
  (渲染的聊天内容)
```

## 组件结构

### 1. ChatWrapper

`ChatWrapper` 组件作为整个聊天界面的容器，负责提供上下文和状态管理。
通过 `useChat` 钩子可以获取整个 `Chat` 对象，从而访问 `renderMessages`、`historyList` 等关键数据。
Vue 等其他框架可以通过 `store` 或 `Provider` 等机制实现类似功能。

```tsx
// ChatWrapper 组件示例
// 这是整个聊天界面的顶层容器，提供上下文管理
const ChatWrapper: React.FC = () => {
    return (
        <ChatProvider>
            <Chat />
        </ChatProvider>
    );
};
```

### 2. Chat

`Chat` 组件是聊天界面的主体部分，包含消息展示区域和输入区域。

```tsx
// Chat 组件示例
// 作为主要布局组件，包含消息列表和输入区域
const Chat: React.FC = () => {
    return (
        <div className="chat-container">
            <div className="chat-main">
                <ChatMessages />
                <ChatInput />
            </div>
        </div>
    );
};
```

### 3. ChatMessages

`ChatMessages` 组件负责渲染各类聊天消息，包括用户消息、AI 回复和工具消息。

`renderMessages` 是提供给 UI 框架进行渲染的对话信息数组，其中包含了所有用户输入和 AI 回复的完整记录，UI 层只需负责渲染展示。

`unique_id` 是专用于渲染的键值，确保在流式输出过程中能够正常更新组件。

```tsx
// ChatMessages 组件示例
// 负责显示所有类型的消息内容
const ChatMessages: React.FC = () => {
    // 从 useChat 钩子获取所需数据和方法
    const { renderMessages, loading, inChatError, client, collapsedTools, toggleToolCollapse } = useChat();

    return (
        <div className="chat-messages">
            {renderMessages.map((message) =>
                message.type === "human" ? (
                    // 渲染用户消息
                    <MessageHuman content={message.content} key={message.unique_id} />
                ) : message.type === "tool" ? (
                    // 渲染工具消息，支持折叠功能
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
                    // 渲染 AI 消息
                    <MessageAI key={message.unique_id} message={message} />
                )
            )}
            {/* 加载状态指示器 */}
            {loading && <div className="loading-indicator">正在思考中...</div>}
            {/* 错误信息展示 */}
            {inChatError && <div className="error-message">{inChatError}</div>}
        </div>
    );
};
```

### 4. ChatInput

`ChatInput` 组件用于用户消息输入，并提供发送和中断操作功能。

`userInput` 和 `setUserInput` 用于管理用户输入的文本内容。

`sendMessage` 函数将 `userInput` 发送给 Langgraph 进行处理。

`stopGeneration` 函数可以中断当前正在进行的 AI 生成任务。

```tsx
// ChatInput 组件示例
// 处理用户输入和交互操作
const ChatInput: React.FC = () => {
    // 从 useChat 钩子获取数据和方法
    const { userInput, setUserInput, loading, sendMessage, stopGeneration } = useChat();
    
    // 处理键盘事件，支持回车发送消息
    const handleKeyPress = (event: React.KeyboardEvent) => {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    };

    return (
        <div className="chat-input">
            <div className="input-container">
                {/* 文本输入区域 */}
                <textarea
                    className="input-textarea"
                    rows={2}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="输入消息..."
                    disabled={loading}
                />
                {/* 发送/中断按钮：根据loading状态切换功能 */}
                <button 
                    className={`send-button ${loading ? "interrupt" : ""}`} 
                    onClick={() => (loading ? stopGeneration() : sendMessage())} 
                    disabled={!loading && !userInput.trim()}
                >
                    {loading ? "中断" : "发送"}
                </button>
            </div>
        </div>
    );
};
```

## 组件集成示例

以下是一个完整的集成示例，展示如何组合上述组件：

```tsx
// 完整应用示例
import React from 'react';
import { ChatProvider, useChat } from '@langgraph-js/sdk';

// 主应用组件
const ChatApplication: React.FC = () => {
  return (
    <div className="chat-application">
      <ChatWrapper />
    </div>
  );
};

// 导出应用
export default ChatApplication;
```

## 总结

自定义 UI 渲染是 `@langgraph-js/sdk` 的核心特性之一，通过组件化的结构设计，您可以:

1. 使用 `ChatWrapper` 作为容器提供全局状态管理
2. 通过 `Chat` 组件组织整体布局结构
3. 利用 `ChatMessages` 组件灵活渲染不同类型的消息（用户、AI、工具）
4. 通过 `ChatInput` 组件处理用户输入和交互操作

这种模块化的设计使您能够根据项目需求自由定制聊天界面的样式和行为，同时保持代码的可维护性和可扩展性。您可以基于这些基础组件进行二次开发，添加自定义功能，如消息历史记录、多媒体支持、主题切换等高级特性。

## 最佳实践

在实现自定义 UI 渲染时，建议遵循以下最佳实践：

1. **保持组件职责单一**：每个组件应该专注于特定功能，避免过度复杂化
2. **统一状态管理**：使用 `useChat` 或类似机制集中管理状态，避免状态分散
3. **优化渲染性能**：对于长对话历史，考虑使用虚拟列表或分页加载
4. **响应式设计**：确保界面在不同设备上都能良好展示
5. **无障碍支持**：添加适当的 ARIA 属性，确保键盘导航可用性
6. **错误处理**：妥善处理网络错误、AI 生成错误等异常情况
