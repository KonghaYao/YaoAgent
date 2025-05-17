# Deno 部署指南

本文档将指导您如何在 Deno 环境中部署和运行 LangGraph Server。

## 环境要求

- Deno 2.0 或更高版本
- PostgreSQL 数据库

## 安装

```bash
pnpm add @langgraph-js/bundler
```

## 构建代码

```sh
pnpm langgraph-bundler
```

## 运行服务器代码

> 注意：执行目录在 dist

```sh
cd dist
deno serve -A --unstable-node-globals ./entrypoint.js
```

## Docker 部署

```dockerfile
# 构建阶段
FROM oven/bun:1.2.13 AS builder

# 创建应用目录
WORKDIR /app

# 复制 package.json 和 package-lock.json (如果存在)
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN bun install --registry=https://registry.npmmirror.com

COPY src ./src
COPY langgraph.json ./langgraph.json
COPY tsconfig.json ./tsconfig.json

# 编译 TypeScript
RUN bun run build

# 生产阶段
FROM denoland/deno:latest AS production

# 创建应用目录
WORKDIR /app

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist /app/dist

COPY --from=builder /app/src/prompt/ /app/dist/src/prompt/

WORKDIR /app/dist

# 启动应用
CMD ["deno", "serve", "--allow-all","--port 8123", "entrypoint.js"]
```
