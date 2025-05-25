# 后端声明-FFT

本文档将指导你如何在后端配置 FFT（Frontend Function as Tools）支持，使你的 LangGraph 应用能够接收和处理来自前端的工具调用。

## 开始配置

按照以下步骤配置后端以支持 FFT：

1. 首先，将以下代码保存到一个新的 TypeScript 文件中（例如 `fe-tools.ts`）：

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

这段代码提供了以下核心功能：

- `FEToolsState`：定义了前端工具的状态管理
- `FETool` 接口：定义了前端工具的数据结构
- `createFeTools`：将前端工具转换为 LangGraph 可用的工具
- `actionToTool`：将前端工具定义转换为可执行的工具实例

2. 在你的图状态定义中集成 FFT 支持：

```ts
const GraphState = Annotation.Root({
    
    // 加上这一行
    ...FEToolsState.spec,
});

```

这一步将 FFT 的状态管理集成到你的 LangGraph 图中，使其能够处理前端工具的状态。

3. 在节点中实现工具调用：

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

在这个示例中：

- `createFeTools` 将前端定义的工具转换为可用的工具集
- 这些工具被集成到 React Agent 中
- Agent 可以使用这些工具来处理用户请求
