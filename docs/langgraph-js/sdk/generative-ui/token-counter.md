# 🔢 Token 计数器

在大规模语言模型（LLM）应用中，跟踪和显示 token 使用量对于监控成本和优化应用性能至关重要。`@langgraph-js/sdk` 提供了内置的 token 计数功能，能够与 LangGraph 存储的数据同步。

> LangGraph 里面的 token 计数可能不是默认开启的，如果你没有看到 token 数据, 尝试开启 `stream usage`

```tsx
new ChatOpenAI({
    modelName,
    streamUsage: true,
    streaming: true,
});
```

## 单轮对话的 Token 汇总

使用以下组件显示每条消息的 token 使用情况：

```tsx
const Message: React.FC = () => {
    const { renderMessages } = useChat();

    return (
        <div>
            {renderMessages().map((message, index) => (
                <div key={index}>
                    {message.content}
                    {message.usage_metadata && (
                        <div className="token-info">
                            <span>📥 {message.usage_metadata.input_tokens || 0}</span>
                            <span>📤 {message.usage_metadata.output_tokens || 0}</span>
                            <span>📊 {message.usage_metadata.total_tokens || 0}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
```

## 全部对话的 Token 汇总

使用以下组件显示所有消息的 token 使用情况：

```tsx
const ChatInput: React.FC = () => {
    const { client } = useChat();
    const tokenCounter = client?.tokenCounter || {};

    return (
        <div className="chat-input">
            <div className="token-info">
                <span>📥 {tokenCounter.input_tokens || 0}</span>
                <span>📤 {tokenCounter.output_tokens || 0}</span>
                <span>📊 {tokenCounter.total_tokens || 0}</span>
            </div>
        </div>
    );
};
```

## 注意事项

- 确保在使用这些组件之前，已正确配置 `@langgraph-js/sdk` 并初始化 `useChat` 钩子。
- token 计数是实时更新的，确保在用户交互时能够准确反映当前的 token 使用情况。
