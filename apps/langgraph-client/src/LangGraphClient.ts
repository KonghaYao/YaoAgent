import { Client, Thread, Message, Assistant, HumanMessage, AIMessage, ToolMessage, Command } from "@langchain/langgraph-sdk";
import { ToolManager } from "./ToolManager.js";
import { CallToolResult } from "./tool/createTool.js";
interface AsyncCallerParams {
    /**
     * The maximum number of concurrent calls that can be made.
     * Defaults to `Infinity`, which means no limit.
     */
    maxConcurrency?: number;
    /**
     * The maximum number of retries that can be made for a single call,
     * with an exponential backoff between each attempt. Defaults to 6.
     */
    maxRetries?: number;
    onFailedResponseHook?: any;
    /**
     * Specify a custom fetch implementation.
     *
     * By default we expect the `fetch` is available in the global scope.
     */
    fetch?: typeof fetch | ((...args: any[]) => any);
}
export type RenderMessage = Message & {
    /** 对于 AIMessage 来说是节点名称，对于工具节点来说是工具名称 */
    name?: string;
    /** 工具节点的触发节点名称 */
    node_name?: string;
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
    tool_call_id?: string;
    response_metadata?: {
        create_time: string;
    };
    /** 耗时 */
    spend_time?: number;
    /** 渲染时的唯一 id，聚合而来*/
    unique_id?: string;
    /** 工具调用是否完成 */
    done?: boolean;
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

/**
 * @zh StreamingMessageType 类用于判断消息的类型。
 * @en The StreamingMessageType class is used to determine the type of a message.
 */
export class StreamingMessageType {
    static isUser(m: Message): m is HumanMessage {
        return m.type === "human";
    }
    static isTool(m: Message): m is ToolMessage {
        return m.type === "tool";
    }
    static isAssistant(m: Message): m is AIMessage {
        return m.type === "ai" && !this.isToolAssistant(m);
    }
    static isToolAssistant(m: Message): m is AIMessage {
        /** @ts-ignore */
        return m.type === "ai" && (m.tool_calls?.length || m.tool_call_chunks?.length);
    }
}

type StreamingUpdateEvent = {
    type: "message" | "value" | "update" | "error" | "thread" | "done" | "start";
    data: any;
};

type StreamingUpdateCallback = (event: StreamingUpdateEvent) => void;

/**
 * @zh LangGraphClient 类是与 LangGraph 后端交互的主要客户端。
 * @en The LangGraphClient class is the main client for interacting with the LangGraph backend.
 */
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
    /**
     * @zh 初始化 Assistant。
     * @en Initializes the Assistant.
     */
    async initAssistant(agentName?: string) {
        try {
            const assistants = await this.listAssistants();
            this.availableAssistants = assistants;
            if (assistants.length > 0) {
                if (agentName) {
                    this.currentAssistant = assistants.find((assistant) => assistant.graph_id === agentName) || null;
                    if (!this.currentAssistant) {
                        throw new Error("Agent not found: " + agentName);
                    }
                } else {
                    this.currentAssistant = assistants[0];
                }
            } else {
                throw new Error("No assistants found");
            }
        } catch (error) {
            console.error("Failed to initialize LangGraphClient:", error);
            throw error;
        }
    }

    /**
     * @zh 创建一个新的 Thread。
     * @en Creates a new Thread.
     */
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

    graphVisualize() {
        return this.assistants.getGraph(this.currentAssistant?.assistant_id!, {
            xray: true,
        });
    }
    /**
     * @zh 列出所有的 Thread。
     * @en Lists all Threads.
     */
    async listThreads<T>() {
        return this.threads.search<T>({
            sortOrder: "desc",
        });
    }

    /**
     * @zh 从历史中恢复 Thread 数据。
     * @en Resets the Thread data from history.
     */
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
    private updateStreamingMessage(message: RenderMessage) {
        const lastMessage = this.streamingMessage[this.streamingMessage.length - 1];
        if (!lastMessage?.id || message.id !== lastMessage.id) {
            this.streamingMessage.push(message);
            return;
        }
        this.streamingMessage[this.streamingMessage.length - 1] = message;
    }
    /** 将 graphMessages 和 streamingMessage 合并，并返回新的消息数组 */
    private combineGraphMessagesWithStreamingMessages() {
        const idMap = new Map<string, RenderMessage>(this.streamingMessage.map((i) => [i.id!, i]));
        return [
            ...this.graphMessages.map((i) => {
                if (idMap.has(i.id!)) {
                    const newValue = idMap.get(i.id!)!;
                    idMap.delete(i.id!);
                    return newValue;
                }
                return i;
            }),
            ...idMap.values(),
        ];
    }
    /**
     * @zh 用于 UI 中的流式渲染中的消息。
     * @en Messages used for streaming rendering in the UI.
     */
    get renderMessage() {
        const previousMessage = new Map<string, Message>();
        const closedToolCallIds = new Set<string>();
        const result: Message[] = [];
        const inputMessages = this.combineGraphMessagesWithStreamingMessages();
        // console.log(inputMessages);
        // 从后往前遍历，这样可以保证最新的消息在前面
        for (let i = inputMessages.length - 1; i >= 0; i--) {
            const message = this.cloneMessage(inputMessages[i]);

            if (!message.id) {
                result.unshift(message);
                continue;
            }
            if (message.type === "ai") {
                /** @ts-ignore */
                if (!message.name) message.name = this.getGraphNodeNow().name;
            }
            if (StreamingMessageType.isToolAssistant(message)) {
                const m = message;
                // 记录这个 id 的消息，并添加到结果中
                previousMessage.set(message.id, m);

                /** @ts-ignore */
                const tool_calls: NonNullable<AIMessage["tool_calls"]> = (m as AIMessage).tool_calls?.length ? (m as AIMessage).tool_calls : (m as RenderMessage).tool_call_chunks;
                const new_tool_calls = tool_calls
                    .filter((i) => {
                        return !closedToolCallIds.has(i.id!);
                    })!
                    .map((tool, index) => {
                        return {
                            type: "tool",
                            additional_kwargs: {},
                            /** @ts-ignore */
                            tool_input: m.additional_kwargs?.tool_calls?.[index]?.function?.arguments,
                            id: tool.id,
                            name: tool.name,
                            response_metadata: {},
                            tool_call_id: tool.id!,
                            content: "",
                        } as ToolMessage;
                    });
                for (const tool of new_tool_calls) {
                    if (!previousMessage.has(tool.id!)) {
                        result.unshift(tool);
                        previousMessage.set(tool.id!, tool);
                    }
                }
                result.unshift(m);
            } else {
                if (message.type === "tool" && message.tool_call_id) {
                    closedToolCallIds.add(message.tool_call_id);
                }

                previousMessage.set(message.id, message);
                result.unshift(message);
            }
        }

        return this.attachInfoForMessage(this.composeToolMessages(result as RenderMessage[]));
    }
    /**
     * @zh 为消息附加额外的信息，如耗时、唯一 ID 等。
     * @en Attaches additional information to messages, such as spend time, unique ID, etc.
     */
    private attachInfoForMessage(result: RenderMessage[]) {
        let lastMessage: RenderMessage | null = null;
        for (const message of result) {
            const createTime = message.response_metadata?.create_time || "";
            // 工具必须要使用 tool_call_id 来保证一致性
            message.unique_id = message.tool_call_id! || message.id!;

            message.spend_time = new Date(createTime).getTime() - new Date(lastMessage?.response_metadata?.create_time || createTime).getTime();
            if (!message.usage_metadata && (message as AIMessage).response_metadata?.usage) {
                const usage = (message as AIMessage).response_metadata!.usage as {
                    prompt_tokens: number;
                    completion_tokens: number;
                    total_tokens: number;
                };
                message.usage_metadata = {
                    ...usage,
                    input_tokens: usage.prompt_tokens,
                    output_tokens: usage.completion_tokens,
                    total_tokens: usage.total_tokens,
                };
            }
            lastMessage = message;
        }
        return result;
    }
    /**
     * @zh 组合工具消息，将 AI 的工具调用和工具的执行结果关联起来。
     * @en Composes tool messages, associating AI tool calls with tool execution results.
     */
    private composeToolMessages(messages: RenderMessage[]): RenderMessage[] {
        const result: RenderMessage[] = [];
        const assistantToolMessages = new Map<string, { args: string }>();
        const toolParentMessage = new Map<string, RenderMessage>();
        for (const message of messages) {
            if (StreamingMessageType.isToolAssistant(message)) {
                /** @ts-ignore 只有 tool_call_chunks 的 args 才是文本 */
                (message.tool_calls || message.tool_call_chunks)?.forEach((element) => {
                    assistantToolMessages.set(element.id!, element);
                    toolParentMessage.set(element.id!, message);
                });
                if (!message.content) continue;
            }
            if (StreamingMessageType.isTool(message) && !message.tool_input) {
                const assistantToolMessage = assistantToolMessages.get(message.tool_call_id!);
                const parentMessage = toolParentMessage.get(message.tool_call_id!);
                if (assistantToolMessage) {
                    message.tool_input = typeof assistantToolMessage.args !== "string" ? JSON.stringify(assistantToolMessage.args) : assistantToolMessage.args;
                    if (message.additional_kwargs) {
                        message.additional_kwargs.done = true;
                        message.done = true;
                    } else {
                        message.done = true;
                        message.additional_kwargs = {
                            done: true,
                        };
                    }
                }
                if (parentMessage) {
                    message.usage_metadata = parentMessage.usage_metadata;
                    message.node_name = parentMessage.name;
                    // 修补特殊情况下，tool name 丢失的问题
                    if (!message.name) {
                        message.name = (parentMessage as AIMessage).tool_calls!.find((i) => i.id === message.tool_call_id)?.name;
                    }
                }
            }
            result.push(message);
        }
        return result;
    }
    /**
     * @zh 获取 Token 计数器信息。
     * @en Gets the Token counter information.
     */
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

    /**
     * @zh 注册流式更新的回调函数。
     * @en Registers a callback function for streaming updates.
     */
    onStreamingUpdate(callback: StreamingUpdateCallback) {
        this.streamingCallbacks.add(callback);
        return () => {
            this.streamingCallbacks.delete(callback);
        };
    }

    private emitStreamingUpdate(event: StreamingUpdateEvent) {
        this.streamingCallbacks.forEach((callback) => callback(event));
    }
    /** 前端工具人机交互时，锁住面板 */
    isFELocking(messages: RenderMessage[]) {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) {
            return false;
        }
        const tool = this.tools.getTool(lastMessage?.name!);
        return tool && tool.render && lastMessage?.type === "tool" && !lastMessage?.additional_kwargs?.done;
    }
    graphState: any = {};
    currentRun?: { run_id: string };
    /**
     * @zh 取消当前的 Run。
     * @en Cancels the current Run.
     */
    cancelRun() {
        if (this.currentThread?.thread_id && this.currentRun?.run_id) {
            this.runs.cancel(this.currentThread!.thread_id, this.currentRun.run_id);
        }
    }
    /**
     * @zh 发送消息到 LangGraph 后端。
     * @en Sends a message to the LangGraph backend.
     */
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
                input: {
                    ...this.graphState,
                    ...this.extraParams,
                    ...(extraParams || {}),
                    messages: messagesToSend,
                    fe_tools: await this.tools.toJSON(this.currentAssistant.graph_id),
                },
                streamMode: ["messages", "values"],
                streamSubgraphs: true,
                command,
            });
        const streamRecord: any[] = [];
        this.emitStreamingUpdate({
            type: "start",
            data: {
                event: "start",
            },
        });
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
                    this.updateStreamingMessage(message);
                }
                this.emitStreamingUpdate({
                    type: "message",
                    data: chunk,
                });
                continue;
            } else if (chunk.event === "values") {
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
                    this.graphState = chunk.data;
                }
                continue;
            } else if (chunk.event.startsWith("values|")) {
                // 这个 values 必然是子 values
                if (chunk.data?.messages) {
                    this.mergeSubGraphMessagesToStreamingMessages(chunk.data.messages);
                }
                this.graphPosition = chunk.event.split("|")[1];
            }
        }
        const data = await this.runFETool();
        if (data) streamRecord.push(...data);
        this.emitStreamingUpdate({
            type: "done",
            data: {
                event: "done",
            },
        });
        this.streamingMessage = [];
        return streamRecord;
    }
    /** 当前子图位置，但是依赖 stream，不太适合稳定使用*/
    private graphPosition = "";
    getGraphPosition() {
        return this.graphPosition.split("|").map((i) => {
            const [name, id] = i.split(":");
            return {
                id,
                name,
            };
        });
    }
    getGraphNodeNow() {
        const position = this.getGraphPosition();
        return position[position.length - 1];
    }
    /** 子图的数据需要通过 merge 的方式重新进行合并更新 */
    private mergeSubGraphMessagesToStreamingMessages(messages: Message[]) {
        const map = new Map(messages.filter((i) => i.id).map((i) => [i.id!, i]));
        this.streamingMessage.forEach((i) => {
            if (map.has(i.id!)) {
                const newValue = map.get(i.id!)!;
                Object.assign(i, newValue);
                map.delete(i.id!);
            }
        });
        // 剩余的 message 一定不在 streamMessage 中
        map.forEach((i) => {
            if (i.type === "tool" && i.tool_call_id) {
                this.streamingMessage.push(i as RenderMessage);
            }
        });
    }

    private runFETool() {
        const data = this.streamingMessage; // 需要保证不被清理
        const lastMessage = data[data.length - 1];
        if (!lastMessage) return;
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
            this.currentThread!.status = "interrupted"; // 修复某些机制下，状态不为 interrupted 与后端有差异
            return Promise.all(result);
        }
    }
    private async callFETool(message: ToolMessage, args: any) {
        const that = this; // 防止 this 被错误解析
        const result = await this.tools.callTool(message.name!, args, { client: that, message });
        if (!result) {
            return;
        }
        return this.resume(result);
    }
    extraParams: Record<string, any> = {};

    /**
     * @zh 继续被前端工具中断的流程。
     * @en Resumes a process interrupted by a frontend tool.
     */
    resume(result: CallToolResult) {
        return this.sendMessage([], {
            command: {
                resume: result,
            },
        });
    }
    /**
     * @zh 标记前端工具等待已完成。
     * @en Marks the frontend tool waiting as completed.
     */
    doneFEToolWaiting(id: string, result: CallToolResult) {
        const done = this.tools.doneWaiting(id, result);
        if (!done && this.currentThread?.status === "interrupted") {
            this.resume(result);
        }
    }

    /**
     * @zh 获取当前的 Thread。
     * @en Gets the current Thread.
     */
    getCurrentThread() {
        return this.currentThread;
    }

    /**
     * @zh 获取当前的 Assistant。
     * @en Gets the current Assistant.
     */
    getCurrentAssistant() {
        return this.currentAssistant;
    }

    /**
     * @zh 重置客户端状态。
     * @en Resets the client state.
     */
    async reset() {
        await this.initAssistant(this.currentAssistant?.graph_id!);
        this.currentThread = null;
        this.graphState = {};
        this.graphMessages = [];
        this.streamingMessage = [];
        this.currentRun = undefined;
        this.tools.clearWaiting();
        this.emitStreamingUpdate({
            type: "value",
            data: {
                event: "messages/partial",
            },
        });
    }
}
