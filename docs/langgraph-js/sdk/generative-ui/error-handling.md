# ❌ 异常信息显示

在生成式 UI 中，良好的错误处理对于提升用户体验至关重要。@langgraph-js/sdk 捕获了 langgraph 运行中的报错信息，你可以展示给用户。

## 基本用法

在 LangGraph SDK 中，错误处理主要通过 `inChatError` 状态进行管理。当 API 调用或其他操作发生错误时，错误信息会被捕获并显示给用户。

```tsx
const ChatMessages = () => {
  const { renderMessages, inChatError } = useChat();
  
  return (
    <div className="chat-messages">
      {renderMessages.map((message) => (
        // 渲染消息...
      ))}
      {inChatError && <div className="error-message">{inChatError}</div>}
    </div>
  );
};
```
