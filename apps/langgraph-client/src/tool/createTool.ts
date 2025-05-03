import { actionParametersToJsonSchema, convertJsonSchemaToZodRawShape } from "./utils";
import { z, ZodRawShape, ZodTypeAny } from "zod";
import { Action, Parameter } from "./copilotkit-actions";
import { zodToJsonSchema } from "zod-to-json-schema";
export interface UnionTool<Args extends ZodRawShape> {
    name: string;
    description: string;
    parameters: Args;
    execute: ToolCallback<Args>;
}
export type ToolCallback<Args extends ZodRawShape> = (args: z.objectOutputType<Args, ZodTypeAny>, context?: any) => CallToolResult | Promise<CallToolResult>;

export type CallToolResult = string | { type: "text"; text: string }[];

/** 用于格式校验 */
export const createTool = <Args extends ZodRawShape>(tool: UnionTool<Args>) => {
    return tool;
};

/** 提供一种兼容 copilotkit 的定义方式，简化定义形式
 * 来自 copilotkit 的 frontend action
 */
export const createFETool = <const T extends Parameter[], Args extends ZodRawShape>(tool: Action<T>): UnionTool<Args> => {
    return {
        name: tool.name,
        description: tool.description || "",
        parameters: convertJsonSchemaToZodRawShape(actionParametersToJsonSchema(tool.parameters || [])) as any,
        async execute(args, context) {
            try {
                const result = await tool.handler?.(args, context);
                if (typeof result === "string") {
                    return [{ type: "text", text: result }];
                }
                return [{ type: "text", text: JSON.stringify(result) }];
            } catch (error) {
                return [{ type: "text", text: `Error: ${error}` }];
            }
        },
    };
};

///======= UnionTool 到 各种工具的辅助函数
export const createJSONDefineTool = <Args extends ZodRawShape>(tool: UnionTool<Args>) => {
    return {
        name: tool.name,
        description: tool.description,
        parameters: zodToJsonSchema(z.object(tool.parameters)),
    };
};

export const createMCPTool = <Args extends ZodRawShape>(tool: UnionTool<Args>) => {
    return [
        tool.name,
        tool.description,
        tool.parameters,
        async (args: z.objectOutputType<Args, ZodTypeAny>) => {
            try {
                const result = await tool.execute(args);
                if (typeof result === "string") {
                    return { content: [{ type: "text", text: result }] };
                }
                return {
                    content: result,
                };
            } catch (error) {
                return { content: [{ type: "text", text: `Error: ${error}` }], isError: true };
            }
        },
    ];
};
