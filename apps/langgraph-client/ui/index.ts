import { LangGraphClient, RenderMessage } from "../src/LangGraphClient";
/** @ts-ignore */
import testResponse from "../test/testResponse.json?raw";
import { createTools } from "./tool";
const main = async () => {
    const client = new LangGraphClient({
        defaultHeaders: {},
    });

    await client.initAssistant("agent");
    await client.createThread();
    client.onStreamingUpdate((event) => {
        updateMessages(client.renderMessage);
    });
    client.tools.bindTools(createTools());
    const messages = await client.sendMessage("你有什么工具", {
        _debug: {
            // streamResponse: JSON.parse(testResponse),
        },
    });
    console.log(client.graphMessages);
    console.log(client.renderMessage);
    console.log(client.tokenCounter);
};

// 声明全局类型
declare global {
    interface Window {
        main: () => Promise<void>;
    }
}

window.main = main;
// main();

function getMessageType(message: RenderMessage): string {
    if ("type" in message) {
        return message.type;
    }
    return "unknown";
}

function renderMessage(message: RenderMessage) {
    const messageDiv = document.createElement("div");
    const messageType = getMessageType(message);
    messageDiv.className = `message ${messageType}`;

    const contentDiv = document.createElement("div");
    contentDiv.className = "message-content";

    const messageContent = `
        <div class="message-header">
            <span class="message-role">${getRoleName(messageType)} </span>
            <span class="message-role">${
                /** @ts-ignore */
                message.name || ""
            }</span>
            ${renderTokenUsage(message.usage_metadata)}
        </div>
        <p class="message-body">
        
        <span>
            ${message.tool_input || ""}
        </span>
        <span>
            ${message.content}
        </span>
        </p>
    `;

    contentDiv.innerHTML = messageContent;
    messageDiv.appendChild(contentDiv);
    return messageDiv;
}

function getRoleName(type: string): string {
    switch (type) {
        case "human":
            return "You";
        case "ai":
            return "AI Assistant";
        case "system":
            return "System";
        default:
            return type;
    }
}

function renderTokenUsage(usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number }) {
    if (!usage) return "";

    return `
        <div class="token-usage">
            ${usage.input_tokens ? `<span class="token-count">Input: ${usage.input_tokens}</span>` : ""}
            ${usage.output_tokens ? `<span class="token-count">Output: ${usage.output_tokens}</span>` : ""}
            ${usage.total_tokens ? `<span class="token-count">Total: ${usage.total_tokens}</span>` : ""}
        </div>
    `;
}

function renderMessages(messages: RenderMessage[]) {
    const container = document.createElement("div");
    container.className = "messages-container";

    messages.forEach((message) => {
        container.appendChild(renderMessage(message));
    });

    return container;
}

export function updateMessages(messages: RenderMessage[]) {
    const messageDiv = document.getElementById("message");
    if (!messageDiv) return;

    messageDiv.innerHTML = "";
    messageDiv.appendChild(renderMessages(messages));
}

// 添加样式
const style = document.createElement("style");
style.textContent = `
    .messages-container {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 1rem;
    }

    .message {
        max-width: 80%;
        padding: 0.75rem;
        border-radius: 0.5rem;
    }

    .message.human {
        align-self: flex-end;
        background-color: #e3f2fd;
    }

    .message.ai {
        align-self: flex-start;
        background-color: #f5f5f5;
    }

    .message.system {
        align-self: center;
        background-color: #fff3e0;
        font-style: italic;
    }

    .message-header {
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: #666;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .message-role {
        font-weight: 600;
    }

    .message-body {
    }

    .token-usage {
        display: flex;
        gap: 0.5rem;
        font-size: 0.75rem;
        color: #888;
    }

    .token-count {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 0.125rem 0.375rem;
        border-radius: 0.25rem;
    }
`;

document.head.appendChild(style);
