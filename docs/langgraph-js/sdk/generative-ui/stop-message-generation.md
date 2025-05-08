# ⏹️ 停止消息生成

在长对话中，您可能需要手动停止正在生成的消息。@langgraph-js/sdk 提供了一种简单的方式来实现这一功能。

## 简单示例

```tsx
import { useChat } from "@langgraph-js/sdk";

const ChatInput: React.FC = () => {
    const { sendMessage, stopGeneration, loading } = useChat();

    return (
        <div className="chat-input">
            <textarea
                placeholder="输入消息..."
                disabled={loading}
            />
            <button 
                onClick={() => (loading ? stopGeneration() : sendMessage())} 
                disabled={!loading}
            >
                {loading ? "中断" : "发送"}
            </button>
        </div>
    );
};
```
