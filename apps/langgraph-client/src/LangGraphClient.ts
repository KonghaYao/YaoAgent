import { Client, Thread, Message, Assistant, HumanMessage, AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { ToolManager } from "./ToolManager";
import { SpendTime } from "./SpendTime";

export type RenderMessage = Message & {
    /** 工具入参 */
    tool_input?: string;
    additional_kwargs?: {
        done?: boolean;
        tool_calls?: {
            function: {
                arguments: string;
            };
        }[];
    };
    usage_metadata?: {
        total_tokens: number;
        input_tokens: number;
        output_tokens: number;
    };
    /** 耗时 */
    spend_time?: number;
    /** 渲染时的唯一 id */
    unique_id?: string;
};

export interface LangGraphClientConfig {
    apiUrl?: string;
    apiKey?: string;
    // callerOptions?: AsyncCallerParams;
    timeoutMs?: number;
    defaultHeaders?: Record<string, string | null | undefined>;
}

export class StreamingMessageType {
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
    type: "message" | "value" | "update" | "error";
    data: any;
};

type StreamingUpdateCallback = (event: StreamingUpdateEvent) => void;

export class LangGraphClient extends Client {
    private currentAssistant: Assistant | null = null;
    private currentThread: Thread | null = null;
    private messages: Message[] = [];
    private streamingCallbacks: Set<StreamingUpdateCallback> = new Set();
    tools: ToolManager = new ToolManager();
    spendTime = new SpendTime();
    stopController: AbortController | null = null;

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

    streamingMessage: RenderMessage[] = [];
    /** 图发过来的更新信息 */
    graphMessages: RenderMessage[] = [];
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

    /** 用于 UI 中的流式渲染中的消息 */
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

        return this.attachUniqueId(this.attachSpendTime(this.composeToolMessages(result as RenderMessage[])));
    }
    attachUniqueId(result: RenderMessage[]) {
        for (const message of result) {
            message.unique_id = message.id! + this.spendTime.getEndTime(message.id!).getTime();
        }
        return result;
    }
    attachSpendTime(result: RenderMessage[]) {
        for (const message of result) {
            message.spend_time = this.spendTime.getSpendTime(message.id!);
        }
        return result;
    }
    composeToolMessages(messages: RenderMessage[]): RenderMessage[] {
        const result: RenderMessage[] = [];
        const assistantToolMessages = new Map<string, { args: string }>();
        const toolParentMessage = new Map<string, RenderMessage>();
        for (const message of messages) {
            if (StreamingMessageType.isToolAssistant(message)) {
                /** @ts-ignore 只有 tool_call_chunks 的 args 才是文本 */
                message.tool_call_chunks?.forEach((element) => {
                    assistantToolMessages.set(element.id!, element);
                    toolParentMessage.set(element.id!, message);
                });
                if (!message.content) continue;
            }
            if (StreamingMessageType.isTool(message) && !message.tool_input) {
                const assistantToolMessage = assistantToolMessages.get(message.tool_call_id!);
                const parentMessage = toolParentMessage.get(message.tool_call_id!);
                if (assistantToolMessage) {
                    message.tool_input = assistantToolMessage.args;
                }
                if (parentMessage) {
                    message.usage_metadata = parentMessage.usage_metadata;
                }
            }
            result.push(message);
        }
        return result;
    }
    get tokenCounter() {
        return this.graphMessages.reduce(
            (acc, message) => {
                if (message.usage_metadata) {
                    acc.total_tokens += message.usage_metadata?.total_tokens || 0;
                    acc.input_tokens += message.usage_metadata?.input_tokens || 0;
                    acc.output_tokens += message.usage_metadata?.output_tokens || 0;
                }
                return acc;
            },
            {
                total_tokens: 0,
                input_tokens: 0,
                output_tokens: 0,
            }
        );
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
    currentRun?: { run_id: string };
    cancelRun() {
        if (this.currentThread?.thread_id && this.currentRun?.run_id) {
            this.runs.cancel(this.currentThread!.thread_id, this.currentRun.run_id);
        }
    }
    async sendMessage(input: string | Message[], { extraParams, _debug }: { extraParams?: Record<string, any>; _debug?: { streamResponse?: any } } = {}) {
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
                input: { ...this.graphState, ...(extraParams || {}), messages: messagesToSend, fe_tools: this.tools.toJSON() },
                streamMode: ["messages", "values"],
                streamSubgraphs: true,
            });
        const streamRecord: any[] = [];
        for await (const chunk of streamResponse) {
            streamRecord.push(chunk);
            if (chunk.event === "metadata") {
                this.currentRun = chunk.data;
            } else if (chunk.event === "error") {
                this.emitStreamingUpdate({
                    type: "error",
                    data: chunk,
                });
            } else if (chunk.event === "messages/partial") {
                for (const message of chunk.data) {
                    this.streamingMessage.push(message);
                    this.spendTime.setSpendTime(message.id);
                }
                this.emitStreamingUpdate({
                    type: "message",
                    data: chunk,
                });
                continue;
            } else if (chunk.event.startsWith("values")) {
                const data = chunk.data as { messages: Message[] };
                if (data.messages) {
                    this.graphMessages = data.messages as RenderMessage[];
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
        const data = await this.checkFECallTool();
        if (data) streamRecord.push(...data);
        return streamRecord;
    }
    checkFECallTool() {
        const data = this.renderMessage;
        const lastMessage = data[data.length - 1];
        // 如果最后一条消息是前端工具消息，则调用工具
        if (lastMessage.type === "tool") {
            if (this.tools.getTool(lastMessage.name!)) {
                // json 校验
                return this.callFETool(lastMessage, JSON.parse(lastMessage.tool_input!));
            }
        }
    }
    async callFETool(message: ToolMessage, args: any) {
        const that = this; // 防止 this 被错误解析
        const tool = this.tools.getTool(message.name!);
        const result = await this.tools.callTool(message.name!, args, { client: that, message });
        const newMessage = { ...message, content: result };
        newMessage.additional_kwargs && (newMessage.additional_kwargs.done = true);
        const returnDirect = tool?.returnDirect;
        if (returnDirect) {
            const messages: Message[] = [newMessage];
            if (typeof tool.callbackMessage === "function") {
                messages.push(tool.callbackMessage(result));
            }
            await this.threads.updateState(this.currentThread!.thread_id, {
                values: {
                    messages,
                },
            });
            this.graphState = (await this.threads.getState(this.currentThread!.thread_id)).values;
            this.graphMessages = this.graphState.messages;
            this.emitStreamingUpdate({
                type: "value",
                data: {
                    event: "messages/partial",
                    data: {
                        messages,
                    },
                },
            });
            return messages;
        } else {
            return await this.sendMessage([newMessage]);
        }
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
