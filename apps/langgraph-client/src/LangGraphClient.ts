import type { Thread, Message, Assistant, HumanMessage, AIMessage, ToolMessage, Command } from "@langchain/langgraph-sdk";
import { EventEmitter } from "eventemitter3";
import { ToolManager } from "./ToolManager.js";
import { CallToolResult } from "./tool/createTool.js";
import { type ILangGraphClient } from "@langgraph-js/pure-graph/dist/types.js";
import { MessageProcessor } from "./MessageProcessor.js";
import { revertChatTo } from "./time-travel/index.js";

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
    sub_agent_messages?: RenderMessage[];
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
    joinRunId?: string;
};
export interface LangGraphClientConfig {
    apiUrl?: string;
    apiKey?: string;
    callerOptions?: {
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
    };
    timeoutMs?: number;
    defaultHeaders?: Record<string, string | null | undefined>;
    /** 自定义客户端实现，如果不提供则使用官方 Client */
    client: ILangGraphClient<any>;
}

// 定义事件数据类型
export interface LangGraphEvents {
    /** 流开始事件 */
    start: { event: "start" };
    /** 消息部分更新事件 */
    message: { event: "messages/partial"; data: Message[] };
    /** 值更新事件 */
    value: { event: "messages/partial" | "values"; data: { messages?: Message[] } };
    /** 错误事件 */
    error: { event: "error"; data: any };
    /** Thread 创建事件 */
    thread: { event: "thread/create"; data: { thread: Thread } };
    /** 流完成事件 */
    done: { event: "done" };
}

/**
 * @zh LangGraphClient 类是与 LangGraph 后端交互的主要客户端。
 * @en The LangGraphClient class is the main client for interacting with the LangGraph backend.
 */
export class LangGraphClient<TStateType = unknown> extends EventEmitter<LangGraphEvents> {
    private client: ILangGraphClient<TStateType>;
    private currentAssistant: Assistant | null = null;
    private currentThread: Thread<TStateType> | null = null;
    tools: ToolManager = new ToolManager();
    availableAssistants: Assistant[] = [];
    graphState: any = {};
    currentRun?: { run_id: string };
    stopController: AbortController | null = null;
    /** 用于存储 subAgent 状态数据的键 */
    subAgentsKey = "task_store";
    /** Message 处理器 */
    private messageProcessor: MessageProcessor;

    constructor(config: LangGraphClientConfig) {
        super();
        this.client = config.client;
        this.messageProcessor = new MessageProcessor(this.subAgentsKey);
    }

    /** 代理 assistants 属性到内部 client */
    get assistants() {
        return this.client.assistants;
    }

    /** 代理 threads 属性到内部 client */
    get threads() {
        return this.client.threads;
    }

    /** 代理 runs 属性到内部 client */
    get runs(): ILangGraphClient["runs"] {
        return this.client.runs;
    }
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
                    this.currentAssistant = assistants.find((assistant: any) => assistant.graph_id === agentName) || null;
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
    async createThread({ threadId, graphId }: { threadId?: string; graphId?: string } = {}) {
        try {
            this.currentThread = await this.threads.create({
                threadId,
                graphId,
            });
            return this.currentThread;
        } catch (error) {
            console.error("Failed to create new thread:", error);
            throw error;
        }
    }

    graphVisualize() {
        return this.assistants.getGraph((this.currentAssistant as any)?.assistant_id!, {
            xray: true,
        });
    }
    /**
     * @zh 列出所有的 Thread。
     * @en Lists all Threads.
     */
    async listThreads() {
        return this.threads.search({
            sortOrder: "desc",
        });
    }
    async deleteThread(threadId: string) {
        return this.threads.delete(threadId);
    }

    /**
     * @zh 从历史中恢复 Thread 数据。
     * @en Resets the Thread data from history.
     */
    async resetThread(agent: string, threadId: string) {
        await this.initAssistant(agent);
        this.currentThread = await this.threads.get(threadId);
        this.graphState = (this.currentThread as any).values;
        const graphMessages = this.graphState?.messages || [];
        this.messageProcessor.setGraphMessages(graphMessages);
        this.emit("value", {
            event: "messages/partial",
            data: {
                messages: this.messageProcessor.getGraphMessages(),
            },
        });
        return this.currentThread;
    }
    // 从历史中恢复时，应该恢复流式状态
    async resetStream() {
        const runs = await this.runs.list((this.currentThread as any)!.thread_id);
        const runningRun = runs?.find((run: any) => run.status === "running" || run.status === "pending");
        if (runningRun) {
            await this.sendMessage([], { joinRunId: runningRun.run_id });
        }
    }

    cloneMessage(message: Message): Message {
        return this.messageProcessor.cloneMessage(message);
    }
    /**
     * @zh 用于 UI 中的流式渲染中的消息。
     * @en Messages used for streaming rendering in the UI.
     */
    get renderMessage() {
        return this.messageProcessor.renderMessages(this.graphState, () => this.getGraphNodeNow());
    }
    /**
     * @zh 获取 Token 计数器信息。
     * @en Gets the Token counter information.
     */
    get tokenCounter() {
        return this.messageProcessor.getGraphMessages().reduce(
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

    /** 前端工具人机交互时，锁住面板 */
    isFELocking(messages: RenderMessage[]) {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage) {
            return false;
        }
        const tool = this.tools.getTool(lastMessage?.name!);
        return tool && tool.render && lastMessage?.type === "tool" && !lastMessage?.additional_kwargs?.done;
    }

    /**
     * @zh 取消当前的 Run。
     * @en Cancels the current Run.
     */
    cancelRun() {
        if ((this.currentThread as any)?.thread_id && this.currentRun?.run_id) {
            this.runs.cancel((this.currentThread as any)!.thread_id, this.currentRun.run_id);
        }
    }
    /**
     * @zh 回滚到指定的消息。但是不会触发数据的重新更新
     * @en Reverts to the specified message.
     */
    async revertChatTo(messageId: string) {
        const { state, checkpoint } = await revertChatTo(this.client as any, this.currentThread!.thread_id, messageId);
        this.graphState = state;
        this.messageProcessor.clearStreamingMessages();
        this.messageProcessor.setGraphMessages(state.messages! as RenderMessage[]);
        return state;
    }
    /**
     * @zh 发送消息到 LangGraph 后端。
     * @en Sends a message to the LangGraph backend.
     */
    async sendMessage(input: string | Message[], { joinRunId, extraParams, _debug, command }: SendMessageOptions = {}) {
        if (!this.currentAssistant) {
            throw new Error("Thread or Assistant not initialized");
        }
        if (!this.currentThread) {
            await this.createThread({ graphId: this.currentAssistant!.graph_id! });
            this.emit("thread", {
                event: "thread/create",
                data: {
                    thread: this.currentThread,
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
        const createStreamResponse = async () => {
            if (_debug?.streamResponse) {
                return _debug.streamResponse;
            }
            if (joinRunId) {
                return this.runs.joinStream(this.currentThread!.thread_id, joinRunId);
            }

            return this.runs.stream(this.currentThread!.thread_id, this.currentAssistant!.assistant_id, {
                input: {
                    ...this.graphState,
                    ...this.extraParams,
                    ...(extraParams || {}),
                    messages: messagesToSend,
                    fe_tools: await this.tools.toJSON(this.currentAssistant!.graph_id),
                },
                streamMode: ["messages", "values"],
                streamSubgraphs: true,
                command,
            });
        };
        const streamResponse = await createStreamResponse();

        const streamRecord: any[] = [];
        this.emit("start", {
            event: "start",
        });
        for await (const chunk of streamResponse) {
            streamRecord.push(chunk);
            if (chunk.event === "metadata") {
                this.currentRun = chunk.data;
            } else if (chunk.event === "error" || chunk.event === "Error" || chunk.event === "__stream_error__") {
                this.emit("error", chunk);
            } else if (chunk.event === "messages/partial") {
                for (const message of chunk.data) {
                    this.messageProcessor.updateStreamingMessage(message);
                }
                this.emit("message", chunk);
                continue;
            } else if (chunk.event === "values") {
                const data = chunk.data as { messages: Message[] };

                if (data.messages) {
                    const isResume = !!command?.resume;
                    const isLongerThanLocal = data.messages.length >= this.messageProcessor.getGraphMessages().length;
                    // resume 情况下，长度低于前端 message 的统统不接受
                    if (!isResume || (isResume && isLongerThanLocal)) {
                        this.messageProcessor.setGraphMessages(data.messages as RenderMessage[]);
                        this.emit("value", chunk);
                    }
                    this.graphState = chunk.data;
                }
                continue;
            } else if (chunk.event.startsWith("values|")) {
                // 这个 values 必然是子 values
                if (chunk.data?.messages) {
                    this.messageProcessor.mergeSubGraphMessagesToStreamingMessages(chunk.data.messages);
                }
                this.graphPosition = chunk.event.split("|")[1];
            }
        }
        const data = await this.runFETool();
        if (data) streamRecord.push(...data);
        this.emit("done", {
            event: "done",
        });
        this.messageProcessor.clearStreamingMessages();
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

    private runFETool() {
        const data = this.messageProcessor.getStreamingMessages(); // 需要保证不被清理
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
        this.messageProcessor.setGraphMessages([]);
        this.messageProcessor.clearStreamingMessages();
        this.currentRun = undefined;
        this.tools.clearWaiting();
        this.emit("value", {
            event: "messages/partial",
            data: {
                messages: [],
            },
        });
    }
}
