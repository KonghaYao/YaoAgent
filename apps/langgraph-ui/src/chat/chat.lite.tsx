import { For, onInit, onMount, useStore } from "@builder.io/mitosis";
import { LangGraphClient, type RenderMessage } from "@langgraph-js/sdk";
import "./chat.css";
import MessageHuman from "./components/MessageHuman.lite";
import MessageAI from "./components/MessageAI.lite";
import MessageTool from "./components/MessageTool.lite";
import { askUserTool, fileTool } from "./tools";
export default function Chat() {
    const state = useStore({
        client: null as LangGraphClient | null,
        messages: [] as RenderMessage[],
        input: "",
        loading: false,
        collapsedTools: [] as string[],
        error: null as string | null,

        formatTime(date: Date) {
            return date.toLocaleTimeString("en-US");
        },

        formatTokens(tokens: number) {
            return tokens.toLocaleString("en");
        },

        getMessageContent(content: any) {
            if (typeof content === "string") return content;
            if (Array.isArray(content)) {
                return content
                    .map((item) => {
                        if (typeof item === "string") return item;
                        if (item.type === "text") return item.text;
                        if (item.type === "image_url") return `[图片]`;
                        return JSON.stringify(item);
                    })
                    .join("");
            }
            return JSON.stringify(content);
        },

        async onInit() {
            const newClient = new LangGraphClient({
                apiUrl: "http://localhost:8123",
            });
            await newClient.initAssistant("agent");
            await newClient.createThread();
            newClient.onStreamingUpdate((event) => {
                if (event.type === "error") {
                    state.loading = false;
                    state.error = event.data?.message || "发生错误";
                }
                state.messages = newClient.renderMessage;
                console.log(newClient.renderMessage);
            });
            newClient.tools.bindTools([fileTool, askUserTool]);
            newClient.graphState = {
                // mcp 开关配置
                // mcpServers: {
                //     "zhipu-web-search-sse": false,
                // },
            };
            console.log(newClient);
            state.client = newClient;
        },

        async sendMessage() {
            if (!state.input.trim() || state.loading) return;

            state.loading = true;
            state.error = null;

            await state.client?.sendMessage(state.input);
            state.input = "";
            state.loading = false;
        },

        interruptMessage() {
            state.client?.cancelRun();
        },

        handleKeyPress(event: KeyboardEvent) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                state.sendMessage();
            }
        },

        toggleToolCollapse(toolId: string) {
            if (state.collapsedTools.includes(toolId)) {
                state.collapsedTools = state.collapsedTools.filter((i) => i !== toolId);
            } else {
                state.collapsedTools = state.collapsedTools.concat(toolId);
            }
        },
    });
    onMount(() => {
        state.onInit();
    });

    return (
        <div class="chat-container">
            <div class="chat-messages">
                <For each={state.messages}>
                    {(message) =>
                        message.type === "human" ? (
                            <MessageHuman content={message.content} key={message.unique_id} />
                        ) : message.type === "tool" ? (
                            <MessageTool
                                key={message.unique_id}
                                message={message}
                                client={state.client!}
                                getMessageContent={state.getMessageContent}
                                formatTokens={state.formatTokens}
                                isCollapsed={state.collapsedTools.includes(message.id!)}
                                onToggleCollapse={() => state.toggleToolCollapse(message.id!)}
                            />
                        ) : (
                            <MessageAI key={message.unique_id} message={message} getMessageContent={state.getMessageContent} formatTokens={state.formatTokens} />
                        )
                    }
                </For>
                {state.loading && <div class="loading-indicator">正在思考中...</div>}
                {state.error && <div class="error-message">{state.error}</div>}
            </div>

            <div class="chat-input">
                <div class="input-container">
                    <textarea
                        class="input-textarea"
                        rows={3}
                        value={state.input}
                        onInput={(e) => (state.input = e.target.value)}
                        onKeyPress={(e) => state.handleKeyPress(e)}
                        placeholder="输入消息..."
                        disabled={state.loading}
                    />
                    <button
                        class={`send-button ${state.loading ? "interrupt" : ""}`}
                        onClick={() => (state.loading ? state.interruptMessage() : state.sendMessage())}
                        disabled={!state.loading && !state.input.trim()}
                    >
                        {state.loading ? "中断" : "发送"}
                    </button>
                </div>
            </div>
        </div>
    );
}
