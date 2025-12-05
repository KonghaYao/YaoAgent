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

[DOCS](https://langgraph-js.netlify.app)

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

## Legacy Mode

Legacy mode is designed to be compatible with environments that don't support `AsyncGeneratorFunction` (such as WeChat Mini Programs). In these environments, standard async iterators may not work properly.

### Legacy Mode Example

```typescript
import { TestLangGraphChat, createChatStore, createLowerJSClient } from "@langgraph-js/sdk";

const client = await createLowerJSClient({
    apiUrl: "http://localhost:8123",
    defaultHeaders: {
        Authorization: "Bearer 123",
    },
});

createChatStore(
    "graph",
    {
        defaultHeaders: {
            Authorization: "Bearer 123",
        },
        client,
        legacyMode: true,
    },
    {}
);
```

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

Then use the ChatProvider in your components:

```tsx
import { ChatProvider, useChat } from "@langgraph-js/sdk/react";
```

Use it in your components:

```tsx
export const MyChat = () => {
    return (
        <ChatProvider
            defaultAgent="agent"
            apiUrl="http://localhost:8123"
            defaultHeaders={{}}
            withCredentials={false}
            showHistory={true}
            showGraph={false}
            onInitError={(error, currentAgent) => {
                console.error(`Failed to initialize ${currentAgent}:`, error);
                // Handle initialization error
            }}
        >
            <ChatComp />
        </ChatProvider>
    );
};

function ChatComp() {
    const chat = useChat();
    // Use chat store methods and state here
}
```

### Vue Integration

First, install the nanostores Vue integration:

```bash
pnpm i @nanostores/vue
```

Then use the ChatProvider in your components:

```typescript
import { ChatProvider, useChat, useChatProvider } from "@langgraph-js/sdk/vue";
```

#### Option 1: Using ChatProvider Component

Use it in your components:

```vue
<template>
    <ChatProvider
        :default-agent="'agent'"
        :api-url="'http://localhost:8123'"
        :default-headers="{}"
        :with-credentials="false"
        :show-history="true"
        :show-graph="false"
        :on-init-error="
            (error, currentAgent) => {
                console.error(`Failed to initialize ${currentAgent}:`, error);
                // Handle initialization error
            }
        "
    >
        <ChatComp />
    </ChatProvider>
</template>

<script setup lang="ts">
import { ChatProvider } from "@langgraph-js/sdk/vue";

function ChatComp() {
    const chat = useChat();
    // Use chat store methods and state here
}
</script>
```

#### Option 2: Using useChatProvider Hook Directly

For more flexibility, you can use the hook directly in your setup:

```vue
<script setup lang="ts">
import { useChatProvider } from "@langgraph-js/sdk/vue";

const props = {
    defaultAgent: "agent",
    apiUrl: "http://localhost:8123",
    defaultHeaders: {},
    withCredentials: false,
    showHistory: true,
    showGraph: false,
    onInitError: (error: any, currentAgent: string) => {
        console.error(`Failed to initialize ${currentAgent}:`, error);
        // Handle initialization error
    },
};

const { unionStore } = useChatProvider(props);
// Use unionStore methods and state here
</script>

<template>
    <ChatComp />
</template>
```

## Documentation

For complete documentation, visit our [official docs](https://langgraph-js.netlify.app).

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the Apache-2.0 License.
