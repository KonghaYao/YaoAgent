import { Client, Thread, Message, Assistant, HumanMessage, AIMessage, ToolMessage, Command } from "@langchain/langgraph-sdk";
import { ToolManager } from "./ToolManager";
import { CallToolResult } from "./tool";
import { AsyncCallerParams } from "@langchain/langgraph-sdk/dist/utils/async_caller";

export type RenderMessage = Message & {
    /** 工具入参 ，聚合而来*/
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
    response_metadata?: {
        create_time: string;
    };
    /** 耗时 */
    spend_time?: number;
    /** 渲染时的唯一 id，聚合而来*/
    unique_id?: string;
};
export type SendMessageOptions = {
    extraParams?: Record<string, any>;
    _debug?: { streamResponse?: any };
    command?: Command;
};
export interface LangGraphClientConfig {
    apiUrl?: string;
    apiKey?: string;
    callerOptions?: AsyncCallerParams;
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
    type: "message" | "value" | "update" | "error" | "thread" | "done";
    data: any;
};

type StreamingUpdateCallback = (event: StreamingUpdateEvent) => void;

export class LangGraphClient extends Client {
    private currentAssistant: Assistant | null = null;
    private currentThread: Thread | null = null;
    private streamingCallbacks: Set<StreamingUpdateCallback> = new Set();
    tools: ToolManager = new ToolManager();
    stopController: AbortController | null = null;

    constructor(config: LangGraphClientConfig) {
        super(config);
    }
    availableAssistants: Assistant[] = [];
    private listAssistants() {
        return this.assistants.search({
            metadata: null,
            offset: 0,
            limit: 100,
        });
    }
    async initAssistant(agentName: string) {
        try {
            const assistants = await this.listAssistants();
            this.availableAssistants = assistants;
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
            return this.currentThread;
        } catch (error) {
            console.error("Failed to create new thread:", error);
            throw error;
        }
    }
    async listThreads<T>() {
        return this.threads.search<T>({
            sortOrder: "desc",
        });
    }
    /** 从历史中恢复数据 */
    async resetThread(agent: string, threadId: string) {
        await this.initAssistant(agent);
        this.currentThread = await this.threads.get(threadId);
        this.graphState = this.currentThread.values;
        this.graphMessages = this.graphState.messages;
        this.emitStreamingUpdate({
            type: "value",
            data: {
                event: "messages/partial",
                data: {
                    messages: this.graphMessages,
                },
            },
        });
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

        return this.attachInfoForMessage(this.composeToolMessages(result as RenderMessage[]));
    }
    attachInfoForMessage(result: RenderMessage[]) {
        let lastMessage: RenderMessage | null = null;
        for (const message of result) {
            const createTime = message.response_metadata?.create_time || "";
            // 用长度作为渲染 id，长度变了就要重新渲染
            message.unique_id = message.id! + JSON.stringify(message.content).length;
            message.spend_time = new Date(createTime).getTime() - new Date(lastMessage?.response_metadata?.create_time || createTime).getTime();
            if (!message.usage_metadata && (message as AIMessage).response_metadata?.usage) {
                const usage = (message as AIMessage).response_metadata!.usage as {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
                message.usage_metadata = {
                    input_tokens: usage.prompt_tokens,
                    output_tokens: usage.completion_tokens,
                    total_tokens: usage.total_tokens,
                };
            }
            lastMessage = message;
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
                    if (message.additional_kwargs) {
                        message.additional_kwargs.done = true;
                    } else {
                        message.additional_kwargs = {
                            done: true,
                        };
                    }
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
                } else if ((message as AIMessage).response_metadata?.usage) {
                    const usage = (message as AIMessage).response_metadata?.usage as {
                        prompt_tokens: number;
                        completion_tokens: number;
                        total_tokens: number;
                    };
                    acc.total_tokens += usage.total_tokens || 0;
                    acc.input_tokens += usage.prompt_tokens || 0;
                    acc.output_tokens += usage.completion_tokens || 0;
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
    async sendMessage(input: string | Message[], { extraParams, _debug, command }: SendMessageOptions = {}) {
        if (!this.currentAssistant) {
            throw new Error("Thread or Assistant not initialized");
        }
        if (!this.currentThread) {
            await this.createThread();
            this.emitStreamingUpdate({
                type: "thread",
                data: {
                    event: "thread/create",
                    data: {
                        thread: this.currentThread,
                    },
                },
            });
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
            this.runs.stream(this.currentThread!.thread_id, this.currentAssistant.assistant_id, {
                input: { ...this.graphState, ...(extraParams || {}), messages: messagesToSend, fe_tools: this.tools.toJSON() },
                streamMode: ["messages", "values"],
                streamSubgraphs: true,
                command,
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
                }
                this.emitStreamingUpdate({
                    type: "message",
                    data: chunk,
                });
                continue;
            } else if (chunk.event.startsWith("values")) {
                const data = chunk.data as { messages: Message[] };

                if (data.messages) {
                    const isResume = !!command?.resume;
                    const isLongerThanLocal = data.messages.length >= this.graphMessages.length;
                    // resume 情况下，长度低于前端 message 的统统不接受
                    if (!isResume || (isResume && isLongerThanLocal)) {
                        this.graphMessages = data.messages as RenderMessage[];
                        this.emitStreamingUpdate({
                            type: "value",
                            data: chunk,
                        });
                    }
                }
                this.graphState = chunk.data;
                this.streamingMessage = [];
                continue;
            }
        }
        this.streamingMessage = [];
        const data = await this.runFETool();
        if (data) streamRecord.push(...data);
        this.emitStreamingUpdate({
            type: "done",
            data: {
                event: "done",
            },
        });
        return streamRecord;
    }
    private runFETool() {
        const data = this.graphMessages;
        const lastMessage = data[data.length - 1];
        // 如果最后一条消息是前端工具消息，则调用工具
        if (lastMessage.type === "ai" && lastMessage.tool_calls?.length) {
            const result = lastMessage.tool_calls.map((tool) => {
                if (this.tools.getTool(tool.name!)) {
                    const toolMessage: ToolMessage = {
                        ...tool,
                        tool_call_id: tool.id!,
                        /** @ts-ignore */
                        tool_input: JSON.stringify(tool.args),
                        additional_kwargs: {},
                    };
                    // json 校验
                    return this.callFETool(toolMessage, tool.args);
                }
            });
            return Promise.all(result);
        }
    }
    private async callFETool(message: ToolMessage, args: any) {
        const that = this; // 防止 this 被错误解析
        const result = await this.tools.callTool(message.name!, args, { client: that, message });
        return this.resume(result);
    }
    /** 恢复消息，当中断流时使用 */
    resume(result: CallToolResult) {
        return this.sendMessage([], {
            command: {
                resume: result,
            },
        });
    }
    /** 完成工具等待 */
    doneFEToolWaiting(id: string, result: CallToolResult) {
        const done = this.tools.doneWaiting(id, result);
        if (!done && this.currentThread?.status === "interrupted") {
            this.resume(result);
        }
    }

    getCurrentThread() {
        return this.currentThread;
    }

    getCurrentAssistant() {
        return this.currentAssistant;
    }

    async reset() {
        await this.initAssistant(this.currentAssistant?.name!);
        this.currentThread = null;
        this.graphState = {};
        this.graphMessages = [];
        this.streamingMessage = [];
        this.currentRun = undefined;
        this.emitStreamingUpdate({
            type: "value",
            data: {
                event: "messages/partial",
            },
        });
    }
}
