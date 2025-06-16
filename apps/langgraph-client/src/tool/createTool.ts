import { actionParametersToJsonSchema, convertJsonSchemaToZodRawShape } from "./utils.js";
import { z, ZodRawShape, ZodTypeAny } from "zod";
import { Action, Parameter } from "./copilotkit-actions.js";
import { zodToJsonSchema } from "zod-to-json-schema";
import { Message } from "@langchain/langgraph-sdk";
import { ToolRenderData } from "./ToolUI.js";

export interface UnionTool<Args extends ZodRawShape, Child extends Object = Object, ResponseType = any> {
    name: string;
    description: string;
    parameters: Args;
    /** 是否直接返回工具结果，而不是通过消息返回 */
    returnDirect?: boolean;
    execute?: ToolCallback<Args>;
    /** 工具执行成功后触发的附加消息 */
    callbackMessage?: (result: CallToolResult) => Message[];
    handler?: (args: z.objectOutputType<Args, ZodTypeAny>, context?: any) => ResponseType | Promise<ResponseType>;
    render?: (tool: ToolRenderData<z.objectOutputType<Args, ZodTypeAny>, ResponseType>) => Child;
    onlyRender?: boolean;
    /** 只允许指定的 agent 使用该工具，如果未指定，则所有 agent 都可以使用 */
    allowAgent?: string[];
    /** 只允许指定的 Graph 使用该工具 */
    allowGraph?: string[];
    /** 是否是纯净的 json schema 参数，而不是 zod 参数 */
    isPureParams?: boolean;
}
export type ToolCallback<Args extends ZodRawShape> = (args: z.objectOutputType<Args, ZodTypeAny>, context?: any) => CallToolResult | Promise<CallToolResult>;

export type CallToolResult = string | { type: "text"; text: string }[];

/** 用于格式校验 */
export const createTool = <Args extends ZodRawShape>(tool: UnionTool<Args>) => {
    return tool;
};

/**
 * create Type Safe Tool with zod and UI Render Feature
 */
export const createUITool = <Args extends ZodRawShape, Child extends Object = {}>(tool: UnionTool<Args, Child>): UnionTool<Args, Child> => {
    const execute =
        tool.execute ||
        (async (args, context) => {
            try {
                const result = await tool.handler?.(args, context);
                if (typeof result === "string") {
                    return [{ type: "text", text: result }];
                }
                return [{ type: "text", text: JSON.stringify(result) }];
            } catch (error) {
                return [{ type: "text", text: `Error: ${error}` }];
            }
        });
    return {
        ...tool,
        execute,
    };
};

/**
 * 提供一种兼容 copilotkit 的定义方式，简化定义形式
 * 来自 copilotkit 的 frontend action
 */
export const createFETool = <const T extends Parameter[], Args extends ZodRawShape, Child extends Object = {}>(
    tool: Action<T> & {
        allowAgent?: string[];
        allowGraph?: string[];
        render?: (tool: ToolRenderData<any, any>) => Child;
        onlyRender?: boolean;
    }
): UnionTool<Args> => {
    return {
        render: tool.render,
        onlyRender: tool.onlyRender,
        name: tool.name,
        description: tool.description || "",
        parameters: convertJsonSchemaToZodRawShape(actionParametersToJsonSchema(tool.parameters || [])) as any,
        returnDirect: tool.returnDirect,
        callbackMessage: tool.callbackMessage,
        allowAgent: tool.allowAgent,
        allowGraph: tool.allowGraph,
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
        parameters: tool.isPureParams ? tool.parameters : zodToJsonSchema(z.object(tool.parameters)),
    };
};

export const createMCPTool = <Args extends ZodRawShape>(tool: UnionTool<Args>) => {
    return [
        tool.name,
        tool.description,
        tool.parameters,
        async (args: z.objectOutputType<Args, ZodTypeAny>) => {
            try {
                const result = await tool.execute?.(args);
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

/**
 * @deprecated Use createUITool instead
 */
export const createToolUI = createFETool;
