# @langgraph-js/sdk

![npm version](https://img.shields.io/npm/v/@langgraph-js/sdk)
![license](https://img.shields.io/npm/l/@langgraph-js/sdk)

> The missing UI SDK for LangGraph - seamlessly integrate your AI agents with frontend interfaces

## Why @langgraph-js/sdk?

Building AI agent applications is complex, especially when you need to bridge the gap between LangGraph agents and interactive user interfaces. This SDK solves the critical challenges of frontend integration:

- **Provides a complete UI integration layer** - no more complex custom code to handle tools, streaming, and state management
- **Simplifies human-in-the-loop interactions** - easily incorporate user feedback within agent workflows
- **Handles edge cases automatically** - interruptions, errors, token management and more
- **Offers a rich set of UI components** - ready-to-use elements to display agent interactions

## Installation

```bash
# Using npm
npm install @langgraph-js/sdk

# Using yarn
yarn add @langgraph-js/sdk

# Using pnpm
pnpm add @langgraph-js/sdk
```

## Key Features

### Generative UI

- ✅ Custom Tool Messages
- ✅ Token Counter
- ✅ Stop Graph Progress
- ✅ Interrupt Handling
- ✅ Error Handling
- ✅ Spend Time Tracking
- ✅ Time Persistence

### Frontend Actions

- ✅ Definition of Union Tools
- ✅ Frontend Functions As Tools
- ✅ Human-in-the-Loop Interaction
- ✅ Interrupt Mode

### Authorization

- ✅ Cookie-Based Authentication
- ✅ Custom Token Authentication

### Persistence

- ✅ Read History from LangGraph

## Advanced Usage

### Creating a Chat Store

You can easily create a reactive store for your LangGraph client:

```typescript
import { createChatStore } from "@langgraph-js/sdk";

export const globalChatStore = createChatStore(
    "agent",
    {
        // Custom LangGraph backend interaction
        apiUrl: "http://localhost:8123",
        // Custom headers for authentication
        defaultHeaders: JSON.parse(localStorage.getItem("code") || "{}"),
        callerOptions: {
            // Example for including cookies
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

### React Integration

First, install the nanostores React integration:

```bash
pnpm i @nanostores/react
```

Then create a context provider for your chat:

```tsx
import React, { createContext, useContext, useEffect } from "react";
import { globalChatStore } from "../store"; // Import your store
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
    // Use store to ensure React gets reactive state updates
    const store = useUnionStore(globalChatStore, useStore);
    
    useEffect(() => {
        // Initialize client
        store.initClient().then(() => {
            // Initialize conversation history
            store.refreshHistoryList();
        });
    }, [store.currentAgent]);

    return <ChatContext.Provider value={store}>{children}</ChatContext.Provider>;
};
```

Use it in your components:

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
    // Use chat store methods and state here
}
```

## Documentation

For complete documentation, visit our [official docs](https://your-docs-url.com).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache-2.0 License.
