import { Annotation, interrupt } from "@langchain/langgraph";
import { createDefaultAnnotation } from "../utils/index.js";
import { DynamicStructuredTool } from "@langchain/core/tools";

export type FEToolsState = typeof FEToolsState.State;
export const FEToolsState = Annotation.Root({
    fe_tools: createDefaultAnnotation<FETool[]>(() => []),
});

export interface FEToolParameters {
    name: string;
    type: string;
    description: string;
    required: boolean;
}

export interface FETool {
    name: string;
    description: string;
    parameters: FEToolParameters[];
}

export const createFETool = (tool: FETool) => {
    return tool;
};

export const createFeTools = (tools: FETool[]): DynamicStructuredTool[] => {
    return tools
        .map((tool) => {
            try {
                return actionToTool(tool);
            } catch (e) {
                console.error(e);
                return null;
            }
        })
        .filter((tool) => tool !== null);
};

export const actionToTool = (tool: FETool): DynamicStructuredTool => {
    const callTool = async (args: Record<string, any>): Promise<[string | string[], null]> => {
        return ["执行中，请求已经触发", null];
    };

    const schema = tool.parameters as any;

    return new DynamicStructuredTool({
        name: tool.name,
        description: tool.description || "",
        schema,
        func: callTool,
        returnDirect: true,
    });
};
