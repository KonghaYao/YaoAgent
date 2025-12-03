import { Message, AIMessage, ToolMessage } from "@langchain/langgraph-sdk";
import { RenderMessage } from "./LangGraphClient.js";

/**
 * @zh StreamingMessageType 类用于判断消息的类型。
 * @en The StreamingMessageType class is used to determine the type of a message.
 */
export class StreamingMessageType {
    static isTool(m: Message): m is ToolMessage {
        return m.type === "tool";
    }

    static isToolAssistant(m: Message): m is AIMessage {
        /** @ts-ignore */
        return m.type === "ai" && (m.tool_calls?.length || m.tool_call_chunks?.length);
    }
}

/**
 * @zh MessageProcessor 类用于统一处理 Message 相关的逻辑，避免重复处理。
 * @en The MessageProcessor class is used to uniformly handle Message-related logic and avoid duplicate processing.
 */
export class MessageProcessor {
    /** 流式消息缓存 */
    private streamingMessage: RenderMessage[] = [];
    /** 图发过来的更新信息 */
    private graphMessages: RenderMessage[] = [];

    constructor() {}

    /**
     * @zh 获取流式消息
     * @en Get streaming messages
     */
    getStreamingMessages(): RenderMessage[] {
        return [...this.streamingMessage];
    }

    /**
     * @zh 设置流式消息
     * @en Set streaming messages
     */
    setStreamingMessages(messages: RenderMessage[]): void {
        this.streamingMessage = messages;
    }

    /**
     * @zh 清空流式消息
     * @en Clear streaming messages
     */
    clearStreamingMessages(): void {
        this.streamingMessage = [];
    }

    /**
     * @zh 获取图消息
     * @en Get graph messages
     */
    getGraphMessages(): RenderMessage[] {
        return [...this.graphMessages];
    }

    /**
     * @zh 设置图消息
     * @en Set graph messages
     */
    setGraphMessages(messages: RenderMessage[]): void {
        this.graphMessages = messages;
    }

    /**
     * @zh 更新流式消息
     * @en Update streaming message
     */
    updateStreamingMessage(message: RenderMessage): void {
        const lastMessage = this.streamingMessage[this.streamingMessage.length - 1];
        if (!lastMessage?.id || message.id !== lastMessage.id) {
            this.streamingMessage.push(message);
            return;
        }
        this.streamingMessage[this.streamingMessage.length - 1] = message;
    }

    /**
     * @zh 将 graphMessages 和 streamingMessage 合并，并返回新的消息数组
     * @en Combine graphMessages and streamingMessage and return a new message array
     */
    combineGraphMessagesWithStreamingMessages(): RenderMessage[] {
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
     * @zh 克隆消息对象
     * @en Clone message object
     */
    cloneMessage(message: Message): Message {
        return JSON.parse(JSON.stringify(message));
    }

    /**
     * @zh 为消息附加额外的信息，如耗时、唯一 ID 等。
     * @en Attaches additional information to messages, such as spend time, unique ID, etc.
     */
    attachInfoForMessage(messages: RenderMessage[]): RenderMessage[] {
        let lastMessage: RenderMessage | null = null;
        const result = [...messages]; // 创建副本避免修改原数组

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
    composeToolMessages(messages: RenderMessage[]): RenderMessage[] {
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
                    const isDone = !!message.content;
                    message.done = isDone;
                    message.additional_kwargs = {
                        ...(parentMessage?.additional_kwargs || {}),
                        ...(message.additional_kwargs || {}),
                        done: isDone,
                    };
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
     * @zh 生成用于 UI 中的流式渲染的消息
     * @en Generate messages used for streaming rendering in the UI
     */
    renderMessages(graphState: any, getGraphNodeNow: () => { name: string }, messagesMetadata: Record<string, any>): RenderMessage[] {
        const previousMessage = new Map<string, Message>();
        const closedToolCallIds = new Set<string>();
        const result: Message[] = [];
        const inputMessages = this.combineGraphMessagesWithStreamingMessages();

        // 从后往前遍历，这样可以保证最新的消息在前面
        for (let i = inputMessages.length - 1; i >= 0; i--) {
            const message = this.cloneMessage(inputMessages[i]);

            if (!message.id) {
                result.unshift(message);
                continue;
            }
            if (message.type === "ai") {
                /** @ts-ignore */
                if (!message.name) message.name = getGraphNodeNow().name;
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

        return this.processMessages(result as RenderMessage[], graphState, messagesMetadata);
    }

    foldTreeMessages(
        messages: RenderMessage[],
        graphState?: {
            task_store?: Record<
                string,
                {
                    messages: RenderMessage[];
                }
            >;
        },
        messagesMetadata?: Record<string, any>
    ): RenderMessage[] {
        const state_sub_messages = Object.entries(graphState?.task_store || {}).map(([key, value]) => [key, value.messages] as [string, RenderMessage[]]);
        const state_sub_messages_map = new Map<string, RenderMessage[]>(state_sub_messages);

        const nonRootMessageId = new Set<string>();
        const parentPointer = new Map(
            Object.entries(messagesMetadata || {})
                .map(([childId, metadata]) => {
                    if (metadata?.parent_id) {
                        nonRootMessageId.add(childId);
                        return [childId, metadata?.parent_id];
                    }
                    return;
                })
                .filter((i): i is [string, string] => i !== undefined)
        );

        // 第一遍遍历：构建 childrenMap，将子消息归类到父消息下
        const childrenMap = state_sub_messages_map;
        const rootMessages: RenderMessage[] = [];

        for (const message of messages) {
            const isRoot = !nonRootMessageId.has(message.id!);
            if (!isRoot) {
                // 处理子消息
                const parentId = parentPointer.get(message.id!)!;
                const children = childrenMap.get(parentId);
                if (children) {
                    children.push(message);
                } else {
                    childrenMap.set(parentId, [message]);
                }
            } else {
                // 收集根消息
                rootMessages.push(message);
            }
        }

        // 第二遍遍历：为所有根消息赋值 sub_messages
        for (const rootMessage of rootMessages) {
            rootMessage.sub_messages = childrenMap.get(rootMessage.id!) || [];
            if (rootMessage.type === "tool" && childrenMap.has(rootMessage.tool_call_id)) {
                rootMessage.sub_messages.unshift(...childrenMap.get(rootMessage.tool_call_id)!);
                // 根据 id 去重
                rootMessage.sub_messages = rootMessage.sub_messages.filter((i, index, self) => self.findIndex((t) => t.id === i.id) === index);
            }
        }
        return rootMessages;
    }
    /**
     * @zh 统一的消息处理入口，按顺序执行所有处理步骤
     * @en Unified message processing entry point, executing all processing steps in order
     */
    processMessages(messages: RenderMessage[], graphState?: any, messagesMetadata?: Record<string, any>): RenderMessage[] {
        // 1. 组合工具消息
        const composedMessages = this.composeToolMessages(messages);

        // 2. 附加信息
        const messagesWithInfo = this.attachInfoForMessage(composedMessages);

        // 3. 折叠树状消息（如果提供了 messagesMetadata）
        return this.foldTreeMessages(messagesWithInfo, graphState, messagesMetadata);
    }
}
