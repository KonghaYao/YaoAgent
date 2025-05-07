# 🛠️ 前端工具 - FFT

FFT (Frontend Function as Tools) 是一个非常好用的工具协议，能够让你的前端函数作为 LangGraph 的 Tool。你只需要编写你的过程函数，像是 MCP 一样，大模型会直接调用你的函数，函数执行的结果也会完美的返回到 LangGraph 后端，继续执行。

> 整个 FFT 是基于 LangGraph 的 interrupt 和 resume 去进行的，你可以访问 [这里]() 查看更多
> FFT 实现依赖于后端，需要后端支持，可以查看 [后端声明](./backend-declare)

## 编写前端工具

前端工具共有两种：

1. 不需要人来确认的，前端只是作为函数，传递数据。
2. 前端可以显示自定义的界面，允许用户输入数据，填写表单等

在初始化的时候可以声明工具使用

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

### 前端过程工具

`name`: 名称最好使用`全英文，下划线和 -` 国外的一些模型不支持中文作为 `name` 属性
`description`: 工具描述信息，请详细描述你的工具的能力，使用的范围
`parameters`: 定义你的工具的入参，handler 里面的 args 就是这个定义的数据格式

```js
import { createFETool ,ToolManager} from "@langgraph-js/sdk";
// 文件操作工具
export const fileTool = createFETool({
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

前端互动工具可以让用户参与到 AI 工作流程中，显示自定义界面并收集用户输入。这种工具特别适合需要人机协作的场景。

```tsx
import { createFETool ,ToolManager } from "@langgraph-js/sdk";
export const askUserTool = createFETool({
    name: "ask_user",
    description: "询问用户",
    parameters: [
        {
            name: "question",
            type: "string",
            description: "问题",
        },
    ],
    // 这个会让整个界面进入loading状态，直到在 UI 界面上 client.doneFEToolWaiting
    handler: ToolManager.waitForUIDone,
});
```

### UI 界面渲染

当大模型调用前端互动工具时，会 interrupt 掉后端，将主动权交给前端，前端可以显示 UI 给用户输入信息。

`message.tool_input` 属性可以获取大模型的入参渲染出来内容。

输入完成之后，前端触发 `client.doneFEToolWaiting` 继续对话。

```tsx
// 工具渲染中给
const MessageTool = ({ message }) => {
    const {client} = useChat()
    return (
        <div className="message tool">
            {message.name === "ask_user" && !message.additional_kwargs?.done && (
                <div>
                    <div>询问 {message.tool_input}</div>
                    <input
                        type="text"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                client.doneFEToolWaiting(message.id!, (e.target as any).value);
                            }
                        }}
                    />
                </div>
            )}
        </div>
    );
};
```
