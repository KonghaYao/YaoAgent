import { interrupt } from "@langchain/langgraph";
import { createDefaultAnnotation } from "./createState.js";
import { ContentAndArtifact, DynamicStructuredTool } from "@langchain/core/tools";
import { createState } from "./createState.js";

export const FEToolsState = createState().build({
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
    const callTool = async (args: Record<string, any>): Promise<ContentAndArtifact> => {
        const data = interrupt(JSON.stringify(args));
        return [data, null];
    };

    const schema = tool.parameters as any;

    return new DynamicStructuredTool({
        name: tool.name,
        description: tool.description || "",
        schema,
        func: callTool,
        responseFormat: "content_and_artifact",
    });
};
