# 后端声明-FFT

修改你的后端，使其能够接收前端的工具调用。

## 开始

1. 先保存下面的代码到一个文件中。

```ts
import { Annotation, interrupt } from "@langchain/langgraph";
import { ContentAndArtifact, DynamicStructuredTool } from "@langchain/core/tools";

const createDefaultAnnotation = <T>(default_value: () => T) =>
    Annotation<T>({
        reducer: (_, a) => a,
        default: default_value,
    });


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

```

2. 然后修改你的图状态定义

```ts
const GraphState = Annotation.Root({
    
    // 加上这一行
    ...FEToolsState.spec,
});

```

3. 在你的节点中使用它

```ts
const myNode = async (state) => {
    // 创建前端工具
    const feTools = createFeTools(state.fe_tools);

    const llm = new ChatOpenAI()
    const agent = createReactAgent({
        name: "executor",
        llm,
        tools, // 这里使用工具
        prompt: "",
    });
    const response = await agent.invoke({
        messages: state.messages,
    });

    return {
        messages: response.messages,
    };
}
```
