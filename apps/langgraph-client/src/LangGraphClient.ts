import { Client, Thread, Message, Assistant, HumanMessage, AIMessage, ToolMessage } from "@langchain/langgraph-sdk";

export type RenderMessage = Message & {
    /** 工具入参 */
    tool_input?: string;
    additional_kwargs?: {
        tool_calls?: {
            function: {
                arguments: string;
            };
        }[];
    };
    response_metadata?: {
        usage: {
            completion_tokens: number;
            completion_tokens_details: {
                audio_tokens: number;
                reasoning_tokens: number;
            };
            prompt_tokens: number;
            prompt_tokens_details: {
                audio_tokens: number;
                cached_tokens: number;
            };
            total_tokens: number;
        };
    };
};

export interface LangGraphClientConfig {
    apiUrl?: string;
    apiKey?: string;
    // callerOptions?: AsyncCallerParams;
    timeoutMs?: number;
    defaultHeaders?: Record<string, string | null | undefined>;
}

class StreamingMessageType {
    static isUser(m: Message) {
        return m.type === "human";
    }
    static isTool(m: Message) {
        return m.type === "tool";
    }
    static isAssistant(m: Message) {
        return m.type === "ai" && !this.isToolAssistant(m);
    }
    static isToolAssistant(m: Message) {
        /** @ts-ignore */
        return m.type === "ai" && (m.tool_calls?.length || m.tool_call_chunks?.length);
    }
}

type StreamingUpdateEvent = {
    type: "message" | "value" | "update";
    data: any;
};

type StreamingUpdateCallback = (event: StreamingUpdateEvent) => void;

export class LangGraphClient extends Client {
    private currentAssistant: Assistant | null = null;
    private currentThread: Thread | null = null;
    private messages: Message[] = [];
    private streamingCallbacks: Set<StreamingUpdateCallback> = new Set();

    constructor(config: LangGraphClientConfig) {
        super(config);
    }

    async initAssistant(agentName: string) {
        try {
            const assistants = await this.assistants.search({
                metadata: null,
                offset: 0,
                limit: 10,
            });

            if (assistants.length > 0) {
                this.currentAssistant = assistants.find((assistant) => assistant.name === agentName) || null;
                if (!this.currentAssistant) {
                    throw new Error("Agent not found");
                }
            } else {
                throw new Error("No assistants found");
            }
        } catch (error) {
            console.error("Failed to initialize LangGraphClient:", error);
            throw error;
        }
    }

    async createThread({
        threadId,
    }: {
        threadId?: string;
    } = {}) {
        try {
            this.currentThread = await this.threads.create({
                threadId,
            });
            this.messages = [];
            return this.currentThread;
        } catch (error) {
            console.error("Failed to create new thread:", error);
            throw error;
        }
    }

    streamingMessage: Message[] = [];
    /** 图发过来的更新信息 */
    graphMessages: Message[] = [];
    cloneMessage(message: Message): Message {
        return JSON.parse(JSON.stringify(message));
    }
    private replaceMessageWithValuesMessage(message: AIMessage | ToolMessage, isTool = false): Message {
        const key = (isTool ? "tool_call_id" : "id") as any as "id";
        const valuesMessage = this.graphMessages.find((i) => i[key] === message[key]);
        if (valuesMessage) {
            return {
                ...valuesMessage,
                /** @ts-ignore */
                tool_input: message.tool_input,
            };
        }
        return message;
    }

    /** 流式渲染中的消息 */
    get renderMessage() {
        const previousMessage = new Map<string, Message>();
        const result: Message[] = [];
        const inputMessages = [...this.graphMessages, ...this.streamingMessage];

        // 从后往前遍历，这样可以保证最新的消息在前面
        for (let i = inputMessages.length - 1; i >= 0; i--) {
            const message = this.cloneMessage(inputMessages[i]);

            if (!message.id) {
                result.unshift(message);
                continue;
            }

            // 如果已经处理过这个 id 的消息，跳过
            if (previousMessage.has(message.id)) {
                continue;
            }

            if (StreamingMessageType.isToolAssistant(message)) {
                const m = this.replaceMessageWithValuesMessage(message as AIMessage);
                // 记录这个 id 的消息，并添加到结果中
                previousMessage.set(message.id, m);

                /** @ts-ignore */
                const tool_calls: NonNullable<AIMessage["tool_calls"]> = (m as AIMessage).tool_calls?.length ? (m as AIMessage).tool_calls : (m as RenderMessage).tool_call_chunks;
                const new_tool_calls = tool_calls!.map((tool, index) => {
                    return this.replaceMessageWithValuesMessage(
                        {
                            type: "tool",
                            additional_kwargs: {},
                            /** @ts-ignore */
                            tool_input: m.additional_kwargs?.tool_calls[index].function.arguments,
                            id: tool.id,
                            name: tool.name,
                            response_metadata: {},
                            tool_call_id: tool.id!,
                        },
                        true
                    );
                });
                for (const tool of new_tool_calls) {
                    if (!previousMessage.has(tool.id!)) {
                        result.unshift(tool);
                        previousMessage.set(tool.id!, tool);
                    }
                }
                result.unshift(m);
            } else {
                // 记录这个 id 的消息，并添加到结果中
                const m = this.replaceMessageWithValuesMessage(message as AIMessage);
                previousMessage.set(message.id, m);
                result.unshift(m);
            }
        }

        return this.composeToolMessages(result as RenderMessage[]);
    }
    composeToolMessages(messages: RenderMessage[]): RenderMessage[] {
        const result: RenderMessage[] = [];
        const assistantToolMessages = new Map<string, { args: string }>();
        for (const message of messages) {
            if (StreamingMessageType.isToolAssistant(message)) {
                /** @ts-ignore 只有 tool_call_chunks 的 args 才是文本 */
                message.tool_call_chunks?.forEach((element) => {
                    assistantToolMessages.set(element.id!, element);
                });
                continue;
            }
            if (StreamingMessageType.isTool(message) && !message.tool_input) {
                const assistantToolMessage = assistantToolMessages.get(message.tool_call_id!);
                if (assistantToolMessage) {
                    message.tool_input = assistantToolMessage.args;
                }
            }
            result.push(message);
        }
        return result;
    }
    onStreamingUpdate(callback: StreamingUpdateCallback) {
        this.streamingCallbacks.add(callback);
        return () => {
            this.streamingCallbacks.delete(callback);
        };
    }

    private emitStreamingUpdate(event: StreamingUpdateEvent) {
        this.streamingCallbacks.forEach((callback) => callback(event));
    }
    graphState: any = {};
    async sendMessage(input: string | Message[], { _debug }: { _debug?: { streamResponse: any } } = {}) {
        if (!this.currentThread || !this.currentAssistant) {
            throw new Error("Thread or Assistant not initialized");
        }

        const messagesToSend = Array.isArray(input)
            ? input
            : [
                  {
                      type: "human",
                      content: input,
                  } as HumanMessage,
              ];
        const streamResponse =
            _debug?.streamResponse ||
            this.runs.stream(this.currentThread.thread_id, this.currentAssistant.assistant_id, {
                input: { messages: messagesToSend },
                streamMode: ["messages", "values", "updates"],
                streamSubgraphs: true,
            });
        const streamRecord: any[] = [];
        for await (const chunk of streamResponse) {
            streamRecord.push(chunk);
            if (chunk.event === "messages/partial") {
                for (const message of chunk.data) {
                    this.streamingMessage.push(message);
                }
                this.emitStreamingUpdate({
                    type: "message",
                    data: chunk,
                });
                continue;
            }

            if (chunk.event.startsWith("values")) {
                const data = chunk.data as { messages: Message[] };
                if (data.messages) {
                    this.graphMessages = data.messages;
                    this.emitStreamingUpdate({
                        type: "value",
                        data: chunk,
                    });
                }
                this.graphState = chunk.data;
                this.streamingMessage = [];
                continue;
            }
        }
        this.streamingMessage = [];
        return streamRecord;
    }

    getCurrentThread() {
        return this.currentThread;
    }

    getCurrentAssistant() {
        return this.currentAssistant;
    }

    getMessages() {
        return [...this.messages];
    }

    async reset() {
        this.currentThread = null;
        this.messages = [];
    }
}
