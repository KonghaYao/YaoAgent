# 🔍 监控系统

LangGraph Server 支持接入多种监控系统，帮助您追踪和分析 AI 应用的运行情况。

## LangFuse 监控集成

[LangFuse](https://langfuse.com/) 是一个开源的、专为 LLM 应用设计的可观测性和分析平台，它可以帮助您:

- 追踪请求和响应
- 分析性能和使用情况
- 监控成本和延迟
- 识别和解决错误

## 配置步骤

### 1. 安装依赖

```bash
npm install langfuse-langchain
# 或
yarn add langfuse-langchain
# 或
pnpm add langfuse-langchain
```

### 2. 创建监控回调文件

在项目中创建一个监控回调处理文件，例如 `src/monitor/index.ts`：

```typescript
import { CallbackHandler } from "langfuse-langchain";
export const langfuseHandler = new CallbackHandler({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY,
    secretKey: process.env.LANGFUSE_SECRET_KEY,
    baseUrl: process.env.LANGFUSE_BASE_URL,
    sampleRate: 1,
});
console.log("Langfuse 监控已开启");
export default [langfuseHandler];
```

### 3. 配置环境变量

在项目根目录的 `.env` 文件中添加 LangFuse 的配置信息：

```
LANGFUSE_PUBLIC_KEY=<您的公钥>
LANGFUSE_SECRET_KEY=<您的密钥>
LANGFUSE_BASE_URL=<LangFuse 部署 URL> # 或您的自托管URL
```

### 4. 在 langgraph.json 中配置回调

更新项目根目录下的 `langgraph.json` 文件，添加回调配置：

```diff
{
    "node_version": "20",
    "dependencies": ["."],
    "graphs": {
        "agent": "./src/super-agent/graph.ts:graph"
    },
+    "callbacks": {
+        "path": "./src/monitor/index.ts"
+    },
    "env": ".env",
    "auth": {
        "path": "./src/auth.ts:auth"
    }
}
```

## 其他监控工具

除 LangFuse 外，您还可以集成其他监控工具，如：

- [LangSmith](https://www.langchain.com/langsmith)
