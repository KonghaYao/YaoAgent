# YaoAgent - Agent 系统文档

## 概述

YaoAgent 是一个基于 LangGraph 的综合 AI Agent 框架，提供了构建、部署和交互智能 Agent 的完整解决方案。它由多个集成的包组成，协同工作以创建一个强大的 Agent 生态系统。

## 架构

```
┌─────────────────────────────────────────────────────────────────┐
│                         YaoAgent 系统                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐   │
│  │    langgraph │    │ langgraph-ui│    │  langgraph-client  │   │
│  │   (后端)     │◄──►│   (前端)     │◄──►│     (SDK/客户端)   │   │
│  └─────────────┘    └─────────────┘    └─────────────────────┘   │
│         ▲                   ▲                      ▲            │
│         │                   │                      │            │
│  ┌──────┴────────┐   ┌──────┴───────┐    ┌────────┴───────┐    │
│  │langgraph-pro  │   │langgraph-ui  │    │ langgraph-artifacts │ │
│  │  (专业库)     │   │  (UI 组件)    │    │   (渲染器)        │    │
│  └───────────────┘   └──────────────┘    └───────────────────┘    │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │           langgraph-crawler (网页爬虫)                 │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 核心组件

### 1. `@langgraph-js/pro` - 高级 Agent 功能

**用途**: 用于构建复杂 AI 工作流和多 Agent 系统的扩展库。

**核心功能**:

#### 状态管理
```typescript
import { AgentState } from "@langgraph-js/pro";

// 包含消息的基础 Agent 状态
const State = AgentState.merge(
    z.object({
        current_plan: z.any().nullable(),
        title: z.string(),
    })
);
```

#### 多 Agent 群协作
```typescript
import { createSwarm, createHandoffTool } from "@langgraph-js/pro";

const coordinator = createAgent({
    name: "coordinator",
    model,
    tools: [
        createHandoffTool({
            agentName: "planner",
            description: "创建计划",
            updateState: keepAllStateInHandOff,
        }),
    ],
});

const swarm = createSwarm({
    agents: [coordinator, planner, researcher, reporter],
    defaultActiveAgent: "coordinator",
});
```

#### 模型助手
```typescript
import { createModelHelper } from "@langgraph-js/pro";

const { ModelState, createLLM } = createModelHelper({
    main_model: ["gpt-4o-mini"],
    assistant_model: ["gpt-4-turbo-preview"],
});

const llm = await createLLM(state, "main_model", {
    temperature: 0.7,
    streaming: true,
});
```

#### Web 工具
```typescript
import { crawler_tool, web_search_tool } from "@langgraph-js/pro";

const tools = [crawler_tool, web_search_tool];
```

### 2. `@langgraph-js/sdk` - 客户端 SDK

**用途**: 与 LangGraph Agent 前端集成的核心客户端 SDK。

**核心功能**:
- 响应式状态的聊天存储管理
- 流式消息支持
- 人机交互 (Human-in-the-Loop)
- 工具绑定和管理
- 错误处理和中断
- 时间跟踪和持久化

**使用示例**:
```typescript
import { createChatStore } from "@langgraph-js/sdk";

const chatStore = createChatStore(
    "agent",
    {
        apiUrl: "http://localhost:8123",
        defaultHeaders: { Authorization: "Bearer token" },
    },
    {
        onInit(client) {
            client.tools.bindTools([]);
        },
    }
);
```

### 3. `@langgraph-js/ui` - UI 组件

**用途**: 用于 Agent 界面的现成 React/Vue 组件。

**核心功能**:
- 带有消息渲染的聊天界面
- 工具可视化组件
- Artifact 渲染
- 用户输入表单工具
- 文件上传组件
- 图表可视化
- 图像生成显示

**内置工具**:
- `ask_user_to_fill_form` - 使用 JSON Schema 的动态表单生成
- `ask_user_with_options` - 多选选择
- `create_artifacts` - React 组件渲染
- `display_information_card` - 信息卡片
- `visualize_data_with_chart` - Chart.js 可视化
- `wait_for_user_to_upload_file` - 文件上传
- `image_generation` - 图像显示
- `human-in-the-loop` - 介入流程

### 4. `langgraph` - 后端应用

**用途**: 带有 Agent 定义的 LangGraph 后端应用。

**核心功能**:
- 入口图定义
- 自定义工具
- 人机交互中间件
- 子 Agent 支持
- Artifact 创建
- 通过 Hono.js 的 HTTP API

**示例 Agent**:
```typescript
const workflow = entrypoint("test-entrypoint", async (state: z.infer<typeof State>) => {
    const agent = createAgent({
        model: new ChatOpenAI({
            model: "mimo-v2-flash",
            modelKwargs: { thinking: { type: "enabled" } },
        }),
        systemPrompt: "你是一个智能助手",
        tools: [show_form, interrupt_test, sub_agent_tool, create_artifacts, hello_world],
        middleware: [
            humanInTheLoopMiddleware({
                interruptOn: {
                    interrupt_test: true,
                },
            }),
        ],
        stateSchema: State,
    });

    return await agent.invoke(state);
});
```

### 5. `@langgraph-js/crawler` - 网页爬虫

**用途**: 用于 LLM 应用的通用网页爬虫，兼容 Tavily API。

**核心功能**:
- 智能内容提取 (Mozilla Readability)
- Markdown 转换
- 搜索 API (Tavily 兼容)
- MCP 协议支持
- 专用清理器 (微信、NPM 等)
- 多平台支持 (Node.js、Deno、Bun、Hono.js)

**支持的网站**:
- 文档网站: NPM、Vitepress、GitHub、MDN、Medium、Anthropic
- 中文网站: 微信公众号、掘金、澎湃新闻、界面新闻、虎嗅、博客园、少数派、InfoQ、CSDN

**使用方式**:
```typescript
import { handleSearchRequest, search } from "@langgraph-js/crawler";

const results = await search({
    query: "你的搜索查询",
    max_results: 5,
    include_raw_content: true,
});
```

### 6. `@langgraph-js/artifacts` - Artifact 渲染器

**用途**: 用于 Artifact 安全 iframe 渲染的 React 组件。

**核心功能**:
- 隔离的执行环境
- Comlink 通信
- 无 localStorage/sessionStorage 访问
- 单文件组件策略

## Agent 类型

### 1. 单 Agent

带工具的基本对话 Agent:

```typescript
const agent = createAgent({
    model: new ChatOpenAI({ model: "gpt-4o-mini" }),
    systemPrompt: "你是一个有用的助手",
    tools: [search_tool, calculator_tool],
});
```

### 2. 子 Agent

作为另一个 Agent 中工具的 Agent:

```typescript
const sub_agent_tool = tool(
    async (props, config) => {
        const toolId = config?.toolCall?.id;
        const agent = createAgent({
            model: new ChatOpenAI({ model: "gpt-4o-mini" }),
            systemPrompt: "你是一个专业助手",
        });

        const data = await agent.invoke({
            messages: [new HumanMessage(props.message)],
        });

        return new Command({
            update: {
                task_store: { [toolId]: data },
            },
        });
    },
    {
        name: "sub_agent_tool",
        schema: z.object({
            message: z.string(),
        }),
    }
);
```

### 3. 多 Agent 群

协调的多 Agent 系统:

```typescript
const coordinator = createAgent({
    name: "coordinator",
    tools: [
        createHandoffTool({ agentName: "planner" }),
        createHandoffTool({ agentName: "researcher" }),
        createHandoffTool({ agentName: "reporter" }),
    ],
});

const swarm = createSwarm({
    agents: [coordinator, planner, researcher, reporter],
    defaultActiveAgent: "coordinator",
});
```

## 工具系统

### 内置工具

#### 表单工具
```typescript
const show_form = tool(
    (props) => {
        console.log(props);
        return "good";
    },
    {
        name: "show_form",
        description: "显示一个 rjsf schema 定义的表单",
        schema: z.object({
            schema: z.any().describe("@rjsf/core 所需要的 form schema"),
        }),
    }
);
```

#### Artifact 工具
```typescript
const create_artifacts = tool(
    async (artifacts) => {
        return "Artifact 操作成功完成";
    },
    {
        name: "create_artifacts",
        description: "创建/更新 React artifacts",
        schema: z.object({
            command: z.enum(["create", "update", "rewrite"]),
            id: z.string(),
            title: z.string(),
            type: z.string(),
            content: z.string(),
            old_str: z.string().optional(),
            new_str: z.string().optional(),
        }),
    }
);
```

#### 中断工具
```typescript
const interrupt_test = tool(
    (props) => {
        console.log(props);
        return "good";
    },
    {
        name: "interrupt_test",
        description: "测试中断",
        schema: z.object({
            message: z.string(),
        }),
    }
);
```

## 人机交互 (Human-in-the-Loop)

### 实现

```typescript
const agent = createAgent({
    tools: [interrupt_test],
    middleware: [
        humanInTheLoopMiddleware({
            interruptOn: {
                interrupt_test: true,
            },
        }),
    ],
});
```

### 流程

1. Agent 调用中断工具
2. 后端暂停执行并发出中断事件
3. 前端显示用户输入选项
4. 用户提交响应
5. 后端使用用户输入恢复执行
6. Agent 继续处理

## 前端集成

### React 集成

```tsx
import { ChatProvider, useChat } from "@langgraph-js/sdk/react";

export const MyChat = () => {
    return (
        <ChatProvider
            defaultAgent="agent"
            apiUrl="http://localhost:8123"
            defaultHeaders={{}}
            showHistory={true}
            showGraph={false}
        >
            <ChatComp />
        </ChatProvider>
    );
};

function ChatComp() {
    const chat = useChat();
    // 使用聊天状态和方法
}
```

### Vue 集成

```vue
<template>
    <ChatProvider
        :default-agent="'agent'"
        :api-url="'http://localhost:8123'"
        :default-headers="{}"
    >
        <ChatComp />
    </ChatProvider>
</template>

<script setup lang="ts">
import { ChatProvider, useChat } from "@langgraph-js/sdk/vue";

function ChatComp() {
    const chat = useChat();
}
</script>
```

## API 端点

### 后端 (Hono.js)

- `POST /threads` - 创建新线程
- `POST /threads/{thread_id}/runs` - 运行 agent
- `POST /threads/{thread_id}/runs/{run_id}/join` - 流式运行
- `POST /threads/{thread_id}/runs/{run_id}/batch` - 批量操作
- `GET /threads/{thread_id}/state` - 获取线程状态
- `POST /threads/{thread_id}/state` - 更新线程状态

### 爬虫 API

- `POST /extract` - 从 URL 提取内容
- `POST /search` - 网页搜索
- `GET /favicon/:domain` - 获取网站图标
- `ALL /mcp` - MCP 协议端点

## 消息流程

```
用户输入
    ↓
前端 (chat.sendMessage)
    ↓
后端 API (/threads/{id}/runs)
    ↓
LangGraph 图执行
    ↓
Agent LLM 调用 (带工具)
    ↓
工具执行 (如果需要)
    ├─→ 网页搜索 (crawler)
    ├─→ 创建 Artifact
    ├─→ 显示表单
    └─→ 子 Agent
    ↓
人机交互 (如果中断)
    ↓
继续/恢复
    ↓
流式响应
    ↓
前端消息更新
    ↓
UI 渲染
```

## 部署

### 启动后端

```bash
cd apps/langgraph
bun run dev
# 服务运行在 http://localhost:8123
```

### 启动 UI

```bash
cd apps/langgraph-ui
npm run dev
# UI 运行在 http://localhost:5173
```

### CLI UI (独立运行)

```bash
npx @langgraph-js/ui
npx @langgraph-js/ui --mode https
npx @langgraph-js/ui --mode https --host localhost.any.com
```

## 环境变量

### LangGraph 后端
```env
OPENAI_API_KEY=your_openai_key
LANGGRAPH_API_KEY=your_langgraph_key
```

### LangGraph UI
```env
VITE_API_URL=http://localhost:8123
```

### 爬虫
```env
SEARCH_SERVER_URL=https://website-to-md.deno.dev
```

## 兼容模式 (Legacy Mode)

对于不支持 `AsyncGeneratorFunction` 的环境 (如微信小程序):

```typescript
import { createLowerJSClient } from "@langgraph-js/sdk";

const client = await createLowerJSClient({
    apiUrl: "http://localhost:8123",
    defaultHeaders: {
        Authorization: "Bearer 123",
    },
});

createChatStore(
    "graph",
    { client, legacyMode: true },
    {}
);
```

## 包结构

```
YaoAgent/
├── apps/
│   ├── langgraph/              # 后端应用
│   ├── langgraph-ui/            # UI 组件库
│   ├── langgraph-client/        # 客户端 SDK
│   ├── langgraph-pro/           # 高级 Agent 库
│   ├── langgraph-crawler/       # 网页爬虫
│   ├── langgraph-artifacts/     # Artifact 渲染器
│   └── alist-sdk/               # Alist 集成
├── docs/                        # 文档
└── package.json                 # Monorepo 配置
```

## 核心概念

### 状态模式
所有 Agent 都使用 Zod 定义的状态模式:
```typescript
const State = z.object({
    messages: withLangGraph(z.custom<BaseMessage[]>(), MessagesZodMeta),
    task_store: z.record(z.string(), z.any()).default({}),
});
```

### 命令模式
用于状态更新和导航:
```typescript
return new Command({
    update: {
        messages: [...],
        task_store: { ... },
    },
});
```

### 工具消息
工具执行的标准消息格式:
```typescript
new ToolMessage({
    content: "result",
    tool_call_id: toolCallId,
})
```

### Artifact 类型
支持的 MIME 类型:
- `application/vnd.ant.react` - React 组件
- 可扩展用于其他类型

## 最佳实践

1. **使用群协作处理复杂任务**: 多 Agent 协作用于复杂工作流
2. **实现人机交互**: 对于需要用户输入的关键决策
3. **使用子 Agent**: 用于模块化任务分解
4. **缓存网页结果**: 减少爬虫 API 调用
5. **处理中断**: 始终提供清晰的用户提示
6. **明智使用 Artifacts**: 仅用于视觉组件，不用于代码片段

## 故障排除

### 常见问题

1. **流式传输不工作**
   - 检查后端是否支持 SSE
   - 验证 `legacyMode` 设置
   - 确保设置了正确的请求头

2. **工具不渲染**
   - 检查工具注册
   - 验证 UI 组件存在
   - 检查工具模式是否与前端期望匹配

3. **子 Agent 状态不更新**
   - 确保返回带有 `update` 的 `Command`
   - 检查 `task_store` 键是否唯一 (使用 `toolCall.id`)
   - 验证状态合并逻辑

## 许可证

Apache-2.0

## 相关链接

- [文档](https://langgraph-js.netlify.app)
- [GitHub 仓库](https://github.com/KonghaYao/YaoAgent)
- [问题反馈](https://github.com/KonghaYao/YaoAgent/issues)
