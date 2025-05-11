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
