# 🛠️ 前端工具 - FFT

FFT (Frontend Function as Tools) 是一个强大的工具协议，它允许你将前端函数无缝集成到 LangGraph 的工具生态系统中。通过 FFT，你可以将任何前端函数转换为 LangGraph 可调用的工具，实现前后端的完美协作。当大模型调用这些工具时，执行结果会自动返回到 LangGraph 后端，确保工作流程的连续性。

> FFT 的核心实现基于 LangGraph 的 interrupt 和 resume 机制，这使得前后端交互变得异常流畅。要了解更多关于这个机制的信息，请访问 [LangGraph 人机交互文档](https://langchain-ai.github.io/langgraph/concepts/human_in_the_loop/)
> 注意：FFT 功能需要后端支持，具体实现细节请参考 [后端声明文档](./backend-declare)

## 编写前端工具

为了简化管理和维护，我们强烈建议将前端工具定义在单独的 tsx 文件中。这样可以更好地组织代码，提高可维护性。

前端工具主要分为两种类型：

1. **纯函数工具**：这类工具不需要用户交互，仅作为数据传递的桥梁。
2. **交互式工具**：这类工具可以展示自定义界面，允许用户进行输入、表单填写等交互操作。

在初始化聊天存储时，你可以同时配置工具的使用：

```ts
import { createChatStore } from "@langgraph-js/sdk";
export const globalChatStore = createChatStore(
    "agent",
    {
        apiUrl: "http://localhost:8123"
    }
    {
        onInit(client) {
            client.tools.bindTools([
                // 可以在这里声明工具
                fileTool, askUserTool
            ]);
        },
    }
);

```

### 定义工具基本参数

在定义工具时，需要注意以下关键参数：

- `name`：工具名称，建议使用英文、下划线和连字符的组合。由于某些模型对中文支持有限，建议避免使用中文作为工具名称。
- `description`：工具描述，需要详细说明工具的功能、使用场景和限制条件。
- `parameters`：定义工具的输入参数，这些参数将作为 handler 函数的参数传入。

```js
import { createToolUI ,ToolManager } from "@langgraph-js/sdk";
// 文件操作工具
export const fileTool = createToolUI({
    name: "file_operation",
    description: "执行文件操作，包括读取和写入",
    parameters: [
        {
            name: "filePath",
            type: "string",
            description: "文件的完整路径",
        },
    ],
    // 在这里可以接收大模型的入参，返回一个信息对象
    async handler(args) {
        // args 是有类型提示的
        await new Promise((resolve) => setTimeout(resolve, 3000));
        // 你可以自定义回复的数据，格式如同 openai 的标准
        return [{ type: "text", text: "执行文件操作 " + args.filePath }];
    },
});


```

### 前端互动工具

前端互动工具是 FFT 的一个强大特性，它允许你创建需要用户参与的交互式界面。这种工具特别适合以下场景：

- 需要用户确认的操作
- 需要用户输入数据的场景
- 需要展示复杂表单的界面
- 需要用户进行选择的场景

使用前端互动工具时，你可以：

1. 通过 `tool.input` 获取大模型传入的参数
2. 使用 `tool.state` 监控工具的状态（"pending" 或 "done"）
3. 通过 `tool.response()` 方法返回用户输入的结果，并继续对话流程

```tsx
import { createToolUI, ToolManager, ToolRenderData } from "@langgraph-js/sdk";
export const askUserTool = createToolUI({
    name: "ask_user",
    description: "询问用户",
    parameters: [
        {
            name: "question",
            type: "string",
            description: "问题",
        },
    ],
    // 这个会让整个界面进入loading状态，直到在 UI 界面上调用 tool.response()
    handler: ToolManager.waitForUIDone,
    // 使用 render 函数来渲染自定义界面
    render(tool: ToolRenderData) {
        const data = tool.input || {};
        // 在这里实现你的UI组件
        return (
            <div>
                <div>{data.question}</div>
                <button onClick={() => tool.response("用户回答")}>
                    提交
                </button>
            </div>
        );
    }
});
```
