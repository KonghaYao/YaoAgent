# 📜 从 LangGraph 读取历史记录

LangGraph UI 提供了强大的历史记录功能，允许用户查看和恢复之前的对话。本文档介绍如何实现历史记录管理。

## 历史记录基本概念

在 LangGraph 中，历史对话由以下部分组成：

- **Thread（线程）**：表示一个完整的对话，包含多个消息
- **Messages（消息）**：对话中的各条消息，包括用户输入、AI 回复和工具调用等
- **Values（状态值）**：存储对话过程中的状态数据

## 获取历史对话列表

历史对话列表通过 `useChat` Hook 提供的 `historyList` 状态获取：

```tsx
import { useChat } from 'langgraph-js';

function HistoryComponent() {
  const { historyList } = useChat();
  
  return (
    <div>
      <h3>历史对话列表</h3>
      <ul>
        {historyList.map((thread) => (
          <li key={thread.id}>{thread.values?.messages?.[0]?.content || '无标题对话'}</li>
        ))}
      </ul>
    </div>
  );
}

```

可以使用 `refreshHistoryList` 函数刷新历史列表：

```tsx
import { useChat } from 'langgraph-js';

function RefreshButton() {
  const { refreshHistoryList } = useChat();
  
  return (
    <button onClick={() => refreshHistoryList()}>
      刷新历史列表
    </button>
  );
}
```

## 历史记录导航

### 创建新对话

用户可以通过点击"New Chat"按钮创建新对话：

```tsx
import { useChat } from 'langgraph-js';

function NewChatButton() {
  const { createNewChat } = useChat();
  
  return (
    <button onClick={() => createNewChat()}>
      新建对话
    </button>
  );
}
```

### 切换到历史对话

可以通过 `toHistoryChat` 函数加载历史对话线程：

```tsx
import { useChat } from 'langgraph-js';

function HistoryItem({ thread }) {
  const { toHistoryChat } = useChat();
  
  return (
    <div>
      <span>{thread.values?.messages?.[0]?.content}</span>
      <button onClick={() => toHistoryChat(thread)}>
        恢复此对话
      </button>
    </div>
  );
}
```

### 删除历史对话

提供删除历史对话的功能：

```tsx
import { useChat } from 'langgraph-js';

function DeleteButton({ thread }) {
  const { deleteHistoryChat } = useChat();
  
  return (
    <button onClick={async () => await deleteHistoryChat(thread)}>
      删除对话
    </button>
  );
}
```
