# @langgraph-js/api

@langgraph-js/api 是 LangGraph 生态系统中的核心组件，提供了开源的 LangGraph 控制平面，为开发者提供一体化的服务器设计、开发和部署解决方案。

开发者不需要改动 LangGraphJS 的原来任何一行代码，即可支持部署到多个 JavaScript 平台，使开发者能够轻松构建、管理和部署基于图的语言模型应用。

> @langgraph-js/api 本质还是一个 Hono 服务器，对外部提供 HTTP 服务。

## 特点

- **一体化服务器设计**：提供完整的后端服务架构
- **多平台支持**：可部署到 Node.js、Deno、Bun 等多种 JavaScript 运行时环境
- **灵活的开发和部署选项**：支持多种配置和部署场景
- **PostgreSQL 持久化**：使用 PostgreSQL 数据库进行可靠的数据持久化
- **LangGraph API 接口兼容**：提供丰富的 API 端点，满足各种应用需求
- **无缝集成**：与 LangGraph 生态系统其他组件紧密集成

## 安装

```bash
npm install @langgraph-js/api
# 或
yarn add @langgraph-js/api
# 或
pnpm add @langgraph-js/api
```

## 快速开始

> 下面的步骤基于你已经有一个 LangGraphJS 项目。

1. 你需要设置一个 PostgreSQL; [PostgreSQL 配置](./postgres-setup.md) - 数据库设置与初始化指南

2. 创建一个 .env 文件

```txt
DATABASE_URL=postgres://postgres:postgres@localhost:5434/langgraph?sslmode=disable
DATABASE_NAME=langgraph
# 第一次启动，初始化才要
# DATABASE_INIT=True
```

3. 创建服务器启动文件

```js
import { startServer } from "@langgraph-js/api/server";
import fs from "node:fs";
import path from "node:path";
const config = JSON.parse(fs.readFileSync(path.join(process.cwd(), "langgraph.json"), "utf8"));
const schema = {
    port: 8123,
    nWorkers: 1,
    host: "0.0.0.0",
    cwd: process.cwd(),
    ...config,
};
const result = await startServer(schema);
console.log("LangGraph is running on http://" + result.host);
console.log(process.cwd());
```
