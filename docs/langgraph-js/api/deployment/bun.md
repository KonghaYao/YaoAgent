# Bun 部署指南

本文档将指导您如何在 Bun 环境中部署和运行 LangGraph Server，利用 Bun 提供的高性能运行时。

## 环境要求

- Bun 1.0 或更高版本
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
bun dev.js
```
