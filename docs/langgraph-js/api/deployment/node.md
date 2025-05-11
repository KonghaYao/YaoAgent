# Node.js 部署指南

本文档将指导您如何在 Node.js 环境中部署和运行 LangGraph Server。

## 环境要求

- Node.js 20 或更高版本
- npm 或 pnpm 包管理器
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
node dev.js
```
