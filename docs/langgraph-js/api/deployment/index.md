# 多平台部署指南

LangGraph Server 支持在多种 JavaScript 平台上部署，包括 Node.js、Deno 和 Bun。

## 构建指令

```sh
npm i -D @langgraph-js/bundler 
```

```sh
npm run langgraph-bundler
```

这将会在 dist 目录下构建出所有的独立可执行文件，
其中 start.js 是 node.js 的启动文件，而 entrypoint.js 是 Serverless 样式的启动版本

> Serverless 样式 是 `export default { fetch }` 的服务器文件形式，通常在 Cloudflare、Deno Deploy 等平台使用。

## 配置文件

无论使用哪种平台，LangGraph Server 都使用 `langgraph.json` 配置文件与 LangGraph 同样：

```json
{
  "node_version": "20",
  "dependencies": ["."],
  "graphs": {
    "agent": "./src/super-agent/graph.ts:graph"
  },
  "env": ".env",
  "auth": {
    "path": "./src/auth.ts:auth"
  }
}
```

## 环境变量

部署方式，请设置环境变量，而不应该使用 .env

```txt
# 数据库配置
DATABASE_URL=postgres://user:password@localhost:5432/langgraph
DATABASE_INIT=true  # 首次运行时设置
DISABLE_AGENT_INIT=true # 关闭服务器开启时注册 agent 的行为

N_WORKERS=4 # 允许同时接收 4 个服务
PORT=8123
HOST=0.0.0.0
```

## 平台特定的部署指南

根据您的需求和环境，选择以下平台之一进行部署：

- [Node.js 部署指南](./node.md) - 使用成熟稳定的 Node.js 环境
- [Deno 部署指南](./deno.md) - 利用 Deno 的安全特性和边缘计算能力
- [Bun 部署指南](./bun.md) - 获取最佳性能和资源利用率
