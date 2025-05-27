# LangGraph 使用指南

## 核心组件

### 1. 状态定义

```typescript
import { createState, createDefaultAnnotation, Annotation } from "@langgraph-js/pro";
import { createReactAgentAnnotation } from "@langchain/langgraph/prebuilt";
import { z } from "zod";

const MyState = createState(createReactAgentAnnotation()).build({
    // 基础类型，带默认值
    messages: createDefaultAnnotation<Message[]>(() => []),
    plan_iterations: createDefaultAnnotation(() => 0),
    
    // 复杂类型，使用 Annotation
    current_plan: Annotation<Plan>,
    
    // 其他状态
    title: createDefaultAnnotation<string>(() => "")
});

// 子类型定义
const Plan = z.object({
    title: z.string(),
    steps: z.array(z.object({
        title: z.string(),
        description: z.string()
    }))
});
```

### 2. Agent 创建

```typescript
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";

// 创建基础 Agent
const agent = createReactAgent({
    name: "agent_name",
    llm: new ChatOpenAI({ modelName: "gpt-4" }),
    tools: [], // 工具列表
    prompt: async (state) => {
        return [new SystemMessage("系统提示"), ...state.messages];
    },
    stateSchema: MyState
});


```

```ts
import { entrypoint } from "@langchain/langgraph";
// 使用 entrypoint 创建 Agent
const entrypointAgent = entrypoint("agent_name", async (state: typeof MyState.State) => {
    const prompt = "系统提示";
    const tools = [
        // 工具列表
    ];
    
    const { messages, current_plan } = await createReactAgent({
        name: "agent_name",
        llm: new ChatOpenAI({ modelName: "gpt-4" }),
        tools,
        prompt,
        stateSchema: MyState
    }).invoke(state);
    
    return {
        messages: [...messages],
        current_plan,
    };
});
```

### 3. 工具定义

```typescript
import { tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { interrupt } from "@langchain/langgraph";
import { z } from "zod";

// 1. 传递 Command 实现工具跳转或者改变 state
const customTool = tool(
    async (input, config) => {
        return new Command({
            update: {
                // 状态更新
            }
        });
    },
    {
        name: "tool_name",
        description: "工具描述",
        schema: z.object({}) // 输入参数定义
    }
);

// 2. 使用 interrupt 实现用户交互
const askUser = tool(
    async (input, config) => {
        return interrupt(JSON.stringify(input));
    },
    {
        name: "ask_user",
        description: "请求用户输入",
        schema: z.object({
            question: z.string()
        })
    }
);
```

### 4. 状态图构建

```typescript
import { StateGraph, START, END } from "@langchain/langgraph";

// 创建状态图
const graph = new StateGraph(MyState)
    .addNode("node_name", async (state) => {
        // 节点处理逻辑
        return { /* 状态更新 */ };
    })
    .addEdge(START, "node_name")
    .addEdge("node_name", END)
    .compile();
```

## Swarm 系统

```typescript
import { createSwarm } from "@langchain/langgraph-swarm";

// 创建多 Agent 协作系统
const swarm = createSwarm({
    agents: [agent1, agent2, graph],
    defaultActiveAgent: "agent1",
    stateSchema: MyState
});

// 编译最终图
const finalGraph = swarm.compile();
```

### Agent 切换

```typescript
import { createHandoffTool, keepAllStateInHandOff } from "@langgraph-js/pro";

const handoffTool = createHandoffTool({
    agentName: "next_agent",
    description: "切换到下一个 Agent",
    // 如果你的 state 还没有保存就调用了工具，那需要使用这个先保存 state，再进行 goto 跳转
    updateState: keepAllStateInHandOff 
});
```

## 常见模式

### 1. 用户交互

```typescript
const askUser = tool(
    async (input, config) => {
        return interrupt(JSON.stringify(input));
    },
    {
        name: "ask_user",
        description: "请求用户输入",
        schema: z.object({
            question: z.string()
        })
    }
);
```

### 3. 条件流转

```typescript
graph.addConditionalEdges(
    "source_node",
    (state) => state.someCondition ? "node_a" : "node_b"
);
```
