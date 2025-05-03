import { createJSONDefineTool, UnionTool } from "./tool/createTool";

export class ToolManager {
    private tools: Map<string, UnionTool<any>> = new Map();

    /**
     * 注册一个工具
     * @param tool 要注册的工具
     */
    bindTool(tool: UnionTool<any>) {
        if (this.tools.has(tool.name)) {
            throw new Error(`Tool with name ${tool.name} already exists`);
        }
        this.tools.set(tool.name, tool);
    }

    /**
     * 注册多个工具
     * @param tools 要注册的工具数组
     */
    bindTools(tools: UnionTool<any>[]) {
        tools.forEach((tool) => this.bindTool(tool));
    }

    /**
     * 获取所有已注册的工具
     * @returns 工具数组
     */
    getAllTools(): UnionTool<any>[] {
        return Array.from(this.tools.values());
    }

    /**
     * 获取指定名称的工具
     * @param name 工具名称
     * @returns 工具实例或 undefined
     */
    getTool(name: string): UnionTool<any> | undefined {
        return this.tools.get(name);
    }

    /**
     * 移除指定名称的工具
     * @param name 工具名称
     * @returns 是否成功移除
     */
    removeTool(name: string): boolean {
        return this.tools.delete(name);
    }

    /**
     * 清空所有工具
     */
    clearTools() {
        this.tools.clear();
    }
    async callTool(name: string, args: any) {
        const tool = this.getTool(name);
        if (!tool) {
            throw new Error(`Tool with name ${name} not found`);
        }
        return await tool.execute(args);
    }
    toJSON() {
        return Array.from(this.tools.values()).map((i) => createJSONDefineTool(i));
    }
}
