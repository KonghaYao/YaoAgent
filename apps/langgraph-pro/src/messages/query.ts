import { AIMessage, BaseMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";

class MessageCheck {
    constructor(public message: BaseMessage) {}

    // 基础类型检查
    isTool(name?: string) {
        return ToolMessage.isInstance(this.message) && (name ? this.message.name === name : true);
    }
    isHuman() {
        return HumanMessage.isInstance(this.message);
    }
    isAI() {
        return AIMessage.isInstance(this.message);
    }
    isSystem() {
        return SystemMessage.isInstance(this.message);
    }

    // 工具调用相关
    isToolCallInvoked(tool_name: string) {
        return Boolean(AIMessage.isInstance(this.message) && this.message?.tool_calls && this.message.tool_calls.length > 0 && this.message.tool_calls.some((i) => i.name === tool_name));
    }
    hasToolCalls() {
        return Boolean(AIMessage.isInstance(this.message) && this.message?.tool_calls && this.message.tool_calls.length > 0);
    }
    getToolCallNames() {
        if (!AIMessage.isInstance(this.message) || !this.message.tool_calls) return [];
        return this.message.tool_calls.map((call) => call.name);
    }

    // 内容检查
    containsText(text: string) {
        return Boolean(this.message.content && typeof this.message.content === "string" && this.message.content.includes(text));
    }
    isEmpty() {
        return !this.message.content || (typeof this.message.content === "string" && this.message.content.trim().length === 0);
    }
    matchesRegex(pattern: RegExp) {
        return this.message.content && typeof this.message.content === "string" && pattern.test(this.message.content);
    }

    // 组合条件检查
    and(otherCheck: (checker: MessageCheck) => boolean) {
        return otherCheck(this);
    }
    or(otherCheck: (checker: MessageCheck) => boolean) {
        return otherCheck(this);
    }
    not() {
        return false; // 这个需要在外部使用逻辑非
    }
}

// 查询条件构建器
class MessageQueryBuilder {
    private conditions: ((checker: MessageCheck) => boolean)[] = [];

    isTool(name?: string) {
        this.conditions.push((checker) => checker.isTool(name));
        return this;
    }
    isHuman() {
        this.conditions.push((checker) => checker.isHuman());
        return this;
    }
    isAI() {
        this.conditions.push((checker) => checker.isAI());
        return this;
    }
    isSystem() {
        this.conditions.push((checker) => checker.isSystem());
        return this;
    }
    hasToolCalls() {
        this.conditions.push((checker) => checker.hasToolCalls());
        return this;
    }
    containsText(text: string) {
        this.conditions.push((checker) => checker.containsText(text));
        return this;
    }
    isNotEmpty() {
        this.conditions.push((checker) => !checker.isEmpty());
        return this;
    }
    custom(condition: (checker: MessageCheck) => boolean) {
        this.conditions.push(condition);
        return this;
    }

    build() {
        const checkFn = (checker: MessageCheck) => this.conditions.every((condition) => condition(checker));
        return new MessageQuery(checkFn);
    }
}

// 查询执行器
class MessageQuery {
    constructor(private checkFn: (checker: MessageCheck) => boolean) {}

    /** 在指定消息数组上执行查询 */
    messages(messages: BaseMessage[]) {
        return new MessageQueryExecutor(messages, this.checkFn);
    }

    /** 获取检查函数 (用于向后兼容) */
    getCheckFn() {
        return this.checkFn;
    }
}

// 查询执行器
class MessageQueryExecutor {
    constructor(
        private messages: BaseMessage[],
        private checkFn: (checker: MessageCheck) => boolean
    ) {}

    /** 获取第一个匹配的消息 */
    first(): BaseMessage | undefined {
        return this.messages.find((i) => this.checkFn(new MessageCheck(i)));
    }

    /** 获取最后一个匹配的消息 */
    last(): BaseMessage | undefined {
        return this.messages.findLast((i) => this.checkFn(new MessageCheck(i)));
    }

    /** 获取所有匹配的消息 */
    all(): BaseMessage[] {
        return this.messages.filter((i) => this.checkFn(new MessageCheck(i)));
    }

    /** 获取匹配的消息数量 */
    count(): number {
        return this.all().length;
    }

    /** 检查是否存在匹配的消息 */
    exists(): boolean {
        return this.messages.some((i) => this.checkFn(new MessageCheck(i)));
    }

    /** 获取指定数量的匹配消息 */
    take(limit: number): BaseMessage[] {
        return this.all().slice(0, limit);
    }

    /** 获取第一个匹配消息的索引 */
    index(): number {
        const index = this.messages.findIndex((i) => this.checkFn(new MessageCheck(i)));
        return index !== -1 ? index : -1;
    }

    /** 获取最后一个匹配消息的索引 */
    lastIndex(): number {
        const index = this.messages.findLastIndex((i) => this.checkFn(new MessageCheck(i)));
        return index !== -1 ? index : -1;
    }

    /** 获取所有匹配消息的索引数组 */
    indices(): number[] {
        const indices: number[] = [];
        this.messages.forEach((msg, index) => {
            if (this.checkFn(new MessageCheck(msg))) {
                indices.push(index);
            }
        });
        return indices;
    }

    /** 获取消息的检查器版本 */
    firstCheck(): MessageCheck | null {
        const msg = this.first();
        return msg ? new MessageCheck(msg) : null;
    }

    lastCheck(): MessageCheck | null {
        const msg = this.last();
        return msg ? new MessageCheck(msg) : null;
    }

    allChecks(): MessageCheck[] {
        return this.all().map((msg) => new MessageCheck(msg));
    }
}

export const checkLastMessage = (messages: BaseMessage[]) => {
    if (messages.length === 0) {
        throw new Error("No messages to check");
    }
    const lastMessage = messages.at(-1)!;
    return new MessageCheck(lastMessage);
};

/** 从消息列表中获取最后一个满足条件的消息 */
export const queryLastMessage = (messages: BaseMessage[], checkFn: (message: MessageCheck) => boolean) => {
    return messages.findLast((i) => checkFn(new MessageCheck(i)));
};

/** 从消息列表中获取第一个满足条件的消息 */
export const queryFirstMessage = (messages: BaseMessage[], checkFn: (message: MessageCheck) => boolean) => {
    return messages.find((i) => checkFn(new MessageCheck(i)));
};

/** 从消息列表中获取所有满足条件的消息 */
export const queryAllMessages = (messages: BaseMessage[], checkFn: (message: MessageCheck) => boolean) => {
    return messages.filter((i) => checkFn(new MessageCheck(i)));
};

/** 从消息列表中获取满足条件的消息，支持更灵活的查询选项 */
export const queryMessages = (
    messages: BaseMessage[],
    options: {
        checkFn?: (message: MessageCheck) => boolean;
        limit?: number;
        reverse?: boolean;
        startIndex?: number;
        endIndex?: number;
    } = {}
) => {
    const { checkFn, limit, reverse = false, startIndex = 0, endIndex = messages.length } = options;

    let filteredMessages = messages.slice(startIndex, endIndex);
    if (checkFn) {
        filteredMessages = filteredMessages.filter((i) => checkFn(new MessageCheck(i)));
    }
    if (reverse) {
        filteredMessages = filteredMessages.reverse();
    }
    if (limit) {
        filteredMessages = filteredMessages.slice(0, limit);
    }
    return filteredMessages;
};

/**
 * 创建消息查询构建器
 *
 * 返回一个 MessageQueryBuilder 实例，用于构建复杂的消息查询条件。
 * 通过链式调用添加条件，然后调用 build() 方法生成可执行的查询对象。
 *
 * @example
 * ```typescript
 * // 基础用法
 * const query = createMessagesQuery()
 *   .isHuman()
 *   .build()
 *   .messages(messages)
 *   .last();
 *
 * // 复杂查询
 * const complexQuery = createMessagesQuery()
 *   .isAI()
 *   .hasToolCalls()
 *   .containsText('search')
 *   .build();
 *
 * const result = complexQuery.messages(messages).all();
 * ```
 *
 * @returns {MessageQueryBuilder} 消息查询构建器实例
 */
export const createMessagesQuery = () => new MessageQueryBuilder();
