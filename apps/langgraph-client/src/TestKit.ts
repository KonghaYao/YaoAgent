import { RenderMessage } from "./LangGraphClient.js";
import { Message } from "@langchain/langgraph-sdk";
import { CallToolResult, UnionTool } from "./tool/createTool.js";
import { ToolRenderData } from "./tool/ToolUI.js";
import { createChatStore } from "./ui-store/createChatStore.js";
/**
 * @zh 测试任务接口
 * @en Test task interface
 */
interface TestTask {
    /** 任务是否成功完成 */
    success: boolean;
    /** 执行任务的函数 */
    runTask: (messages: readonly RenderMessage[]) => Promise<void>;
    /** 任务失败时的回调函数 */
    fail: () => void;
}

export class TestLogger {
    info(message: string) {
        console.log(message);
    }
    logMessage(message: RenderMessage) {
        const emoji = message.type === "ai" ? "🤖" : message.type === "human" ? "👤" : "🔧";

        const header = `${emoji} ${message.type} | ${message.name ?? "null"} | ${message.id}`;
        if (message.type === "tool") {
            return `${header}
🔧 Input: ${message.tool_input?.slice(0, 100) ?? ""}
💬 Output: ${message.content?.slice(0, 100) ?? ""}
`;
        }

        console.log(`---
${header}
💬 Output: ${message.content?.slice(0, 100) ?? ""}
`);
    }
}
/**
 * @zh LangGraph 测试工具，可以配合 vitest 等常用框架进行测试
 * @en LangGraph test tool, can be used with vitest and other common frameworks for testing
 *
 * @example
 * ```typescript
 * const testChat = new TestLangGraphChat(createLangGraphClient(), { debug: true });
 * await testChat.humanInput("你好", async () => {
 *     const aiMessage = await testChat.waitFor("ai");
 *     expect(aiMessage.content).toBeDefined();
 * });
 * ```
 */
export class TestLangGraphChat {
    /** 是否开启调试模式 */
    private debug = false;
    /** 上次消息数量，用于检测消息变化 */
    private lastLength = 0;
    /** 待处理的测试任务列表 */
    protected processFunc: TestTask[] = [];
    /** 自定义日志器 */
    private logger: TestLogger;
    /**
     * @zh 构造函数，初始化测试环境
     * @en Constructor, initialize test environment
     */
    constructor(
        readonly store: ReturnType<typeof createChatStore>,
        options: {
            debug?: boolean;
            tools?: UnionTool<any, any, any>[];
            logger?: TestLogger;
        }
    ) {
        this.debug = options.debug ?? false;
        this.logger = options.logger ?? new TestLogger();
        options.tools && this.addTools(options.tools);
        const renderMessages = this.store.data.renderMessages;

        // 订阅消息变化，自动检查任务完成状态
        renderMessages.subscribe((messages) => {
            this.checkAllTask(messages);
        });
    }

    /**
     * @zh 获取当前所有渲染消息
     * @en Get all current render messages
     */
    getMessages() {
        return this.store.data.renderMessages.get();
    }

    /**
     * @zh 添加工具到测试环境中，会自动包装工具的 execute 方法
     * @en Add tools to test environment, automatically wraps tool execute methods
     *
     * @example
     * ```typescript
     * const tools = [createUITool({ name: "test_tool", ... })];
     * testChat.addTools(tools);
     * ```
     */
    addTools(tools: UnionTool<any, any, any>[]) {
        tools.forEach((tool) => {
            if (tool.execute) {
                const oldExecute = tool.execute;
                // 包装原始的 execute 方法，在执行后触发任务检查
                tool.execute = (...args) => {
                    setTimeout(() => {
                        this.checkAllTask(this.getMessages(), {
                            skipLengthCheck: true,
                        });
                    }, 100);
                    return oldExecute!(...args);
                };
            }
        });
        this.store.mutations.setTools(tools);
    }

    /**
     * @zh 设置额外参数
     * @en Set extra states to LangGraph
     *
     * @example
     * ```typescript
     * testChat.setExtraParams({
     *     extraParam: "value",
     * });
     */
    setExtraParams(extraParams: Record<string, any>) {
        const client = this.store.data.client.get();
        if (client) {
            client.extraParams = extraParams;
        }
    }
    /**
     * @zh 检查所有待处理的测试任务，只有在消息数量发生变化时才执行检查
     * @en Check all pending test tasks, only executes when message count changes
     */
    checkAllTask(messages: readonly RenderMessage[], options: { skipLengthCheck?: boolean } = {}) {
        // 只有 lastLength 发生变化时，才执行检查
        if (!options.skipLengthCheck && this.lastLength === messages.length) {
            return;
        }
        this.lastLength = messages.length;

        // 执行所有未完成的任务
        for (const task of this.processFunc) {
            !task.success && task.runTask(options.skipLengthCheck ? messages : messages.slice(0, -1));
        }

        // 调试模式下打印最新消息
        const item = messages[messages.length - (options.skipLengthCheck ? 1 : 2)];
        if (this.debug && item) {
            this.logger.logMessage(item);
        }
    }

    private readited = false;
    /**
     * @zh 准备测试环境，初始化客户端连接
     * @en Prepare test environment, initialize client connection
     */
    ready() {
        if (this.readited) {
            return;
        }
        this.readited = true;
        return this.store.mutations.initClient();
    }

    /**
     * @zh 模拟人类输入消息并等待测试任务完成，这是测试的核心方法
     * @en Simulate human input and wait for test tasks to complete, this is the core test method
     *
     * @example
     * ```typescript
     * await testChat.humanInput("请帮我思考一下", async () => {
     *     const toolMessage = await testChat.waitFor("tool", "thinking");
     *     expect(toolMessage.tool_input).toBeDefined();
     *
     *     const aiMessage = await testChat.waitFor("ai");
     *     expect(aiMessage.content).toContain("思考");
     * });
     * ```
     */
    async humanInput(text: Message["content"], context: () => Promise<void>) {
        await this.ready();
        // console.log(text);
        return Promise.all([
            context(),
            this.store.mutations
                .sendMessage([
                    {
                        type: "human",
                        content: text,
                    },
                ])
                .then(async () => {
                    // messages 有 10 ms 的 debounce，我们需要稍等一下
                    await new Promise((resolve) => setTimeout(resolve, 20));
                    this.checkAllTask(this.getMessages(), {
                        skipLengthCheck: true,
                    });
                })
                .then(async (res) => {
                    // 检查是否还有未完成的任务
                    const tasks = this.processFunc.filter((i) => {
                        return !i.success;
                    });
                    if (tasks.length) {
                        console.warn("still have ", tasks.length, " tasks");
                        await Promise.all(tasks.map((i) => i.fail()));
                        throw new Error("test task failed");
                    }
                    this.processFunc = [];
                    return res;
                }),
        ]);
    }

    /**
     * @zh 等待特定类型的消息出现，创建异步等待任务
     * @en Wait for specific type of message to appear, creates async waiting task
     *
     * @example
     * ```typescript
     * // 等待 AI 回复
     * const aiMessage = await testChat.waitFor("ai");
     *
     * // 等待特定工具调用
     * const toolMessage = await testChat.waitFor("tool", "sequential-thinking");
     * ```
     */
    waitFor<D extends "tool" | "ai", T extends RenderMessage, N extends D extends "tool" ? string : undefined>(type: D, name?: N): Promise<T> {
        return new Promise((resolve, reject) => {
            this.processFunc.push({
                success: false,
                async runTask(messages) {
                    const lastMessage = messages[messages.length - 1];
                    if (!lastMessage) {
                        return;
                    }
                    // 检查消息类型和名称是否匹配
                    if (lastMessage.type === type && (name ? lastMessage.name === name : true)) {
                        resolve(lastMessage as T);
                        this.success = true;
                    }
                },
                fail() {
                    reject(new Error(`wait for ${type} ${name} failed`));
                },
            });
        });
    }

    /**
     * @zh 响应前端工具调用，模拟用户对工具的响应
     * @en Respond to frontend tool calls, simulates user response to tools
     *
     * @example
     * ```typescript
     * const toolMessage = await testChat.waitFor("tool", "ask_user_for_approve");
     * await testChat.responseFeTool(toolMessage, "approved");
     * ```
     */
    async responseFeTool(message: RenderMessage, value: CallToolResult) {
        if (message.content) {
            throw new Error(`message is Done. content: ${message.content}`);
        }
        const tool = new ToolRenderData(message, this.store.data.client.get()!);
        tool.response(value);
        const messages = await this.waitFor("tool", message.name!);

        if (messages.content) {
            return messages;
        }
        throw new Error("tool response failed");
    }

    /**
     * @zh 查找最后一条指定类型的消息，从消息数组末尾开始向前查找
     * @en Find the last message of specified type, searches backwards from end of messages
     *
     * @example
     * ```typescript
     * // 查找最后一条 AI 消息
     * const lastAI = testChat.findLast("ai");
     *
     * // 查找最后一条人类消息
     * const lastHuman = testChat.findLast("human");
     * ```
     */
    findLast(type: "human" | "ai" | "tool", options: { before?: (item: RenderMessage) => boolean } = {}) {
        const messages = this.getMessages();

        for (let i = messages.length - 1; i >= 0; i--) {
            const item = messages[i];
            if (type === item.type) {
                return item;
            }
            if (options.before && options.before(item)) {
                throw new Error(`${type} not found; before specified`);
            }
        }
        throw new Error(`${type} not found `);
    }
}
