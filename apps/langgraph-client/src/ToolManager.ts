import { ToolMessage } from "@langchain/langgraph-sdk";
import { LangGraphClient } from "./LangGraphClient.js";
import { CallToolResult, createJSONDefineTool, UnionTool } from "./tool/createTool.js";

/**
 * @zh ToolManager 类用于管理和执行工具。
 * @en The ToolManager class is used to manage and execute tools.
 */
export class ToolManager {
    private tools: Map<string, UnionTool<any>> = new Map();
    // === 专门为前端设计的异步触发结构
    private waitingMap: Map<string, (value: CallToolResult) => void> = new Map();

    /**
     * @zh 注册一个工具。
     * @en Registers a tool.
     */
    bindTool(tool: UnionTool<any>) {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool with name ${tool.name} already exists`);
        }
        this.tools.set(tool.name, tool);
    }

    /**
     * @zh 注册多个工具。
     * @en Registers multiple tools.
     */
    bindTools(tools: UnionTool<any>[]) {
        tools.forEach((tool) => this.bindTool(tool));
    }

    /**
     * @zh 获取所有已注册的工具。
     * @en Gets all registered tools.
     */
    getAllTools(): UnionTool<any>[] {
        return Array.from(this.tools.values());
    }

    /**
     * @zh 获取指定名称的工具。
     * @en Gets the tool with the specified name.
     */
    getTool(name: string): UnionTool<any> | undefined {
        return this.tools.get(name);
    }

    /**
     * @zh 移除指定名称的工具。
     * @en Removes the tool with the specified name.
     */
    removeTool(name: string): boolean {
        return this.tools.delete(name);
    }

    /**
     * @zh 清空所有工具。
     * @en Clears all tools.
     */
    clearTools() {
        this.tools.clear();
    }
    reset() {
        this.clearTools();
        this.clearWaiting();
    }
    clearWaiting() {
        this.waitingMap.clear();
    }

    /**
     * @zh 调用指定名称的工具。
     * @en Calls the tool with the specified name.
     */
    async callTool(name: string, args: any, context: { client: LangGraphClient; message: ToolMessage }) {
        const tool = this.getTool(name);
        if (!tool) {
            throw new Error(`Tool with name ${name} not found`);
        }
        return await tool.execute(args, context);
    }

    /**
     * @zh 将所有工具转换为 JSON 定义格式。
     * @en Converts all tools to JSON definition format.
     */
    toJSON(graphId: string, remote = true) {
        return Array.from(this.tools.values())
            .filter((i) => (remote ? !i.onlyRender : true))
            .filter((i) => !i.allowGraph || i.allowGraph.includes(graphId))
            .map((i) => createJSONDefineTool(i));
    }

    /**
     * @zh 标记指定 ID 的工具等待已完成，并传递结果。
     * @en Marks the tool waiting with the specified ID as completed and passes the result.
     */
    doneWaiting(id: string, value: CallToolResult) {
        if (this.waitingMap.has(id)) {
            this.waitingMap.get(id)!(value);
            this.waitingMap.delete(id);
            return true;
        } else {
            console.warn(`Waiting for tool ${id} not found`);
            return false;
        }
    }

    /**
     * @zh 等待指定 ID 的工具完成。
     * @en Waits for the tool with the specified ID to complete.
     */
    waitForDone(id: string) {
        if (this.waitingMap.has(id)) {
            return this.waitingMap.get(id);
        }
        const promise = new Promise((resolve, reject) => {
            this.waitingMap.set(id, resolve);
        });
        return promise;
    }

    /**
     * @zh 一个静态方法，用于在前端等待用户界面操作完成。
     * @en A static method used in the frontend to wait for user interface operations to complete.
     */
    static waitForUIDone<T>(_: T, context: { client: LangGraphClient; message: ToolMessage }) {
        // console.log(context.message);
        return context.client.tools.waitForDone(context.message.id!);
    }
}
