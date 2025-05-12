# LangGraph Server

LangGraph Server 是 LangGraph Platform 的开源实现，使用 PostgreSQL 进行持久化，是一个可以开源私有化部署的解决方案。它提供了一个强大的平台，用于构建、部署和管理基于图的语言模型应用。

## 生态系统

LangGraph 生态系统由以下几个核心组件组成：

### @langgraph-js/sdk

客户端框架，提供了与 LangGraph Server 直接交互的能力。该SDK封装了简便的状态工具，使开发者能够轻松管理应用状态，并与服务器进行无缝通信。主要功能包括：

- 便捷的状态管理工具
- 与LangGraph Server的无缝集成
- 支持异步操作和事件处理

[查看 SDK 详细文档](../sdk/index.md)

### @langgraph-js/api

开源的 LangGraph 控制平面，提供了一体化的服务器设计、开发和部署方案。它支持部署到多个 JavaScript 平台，使开发者能够在不同环境中运行他们的应用。核心特性：

- 一体化的服务器设计
- 灵活的开发和部署选项
- 多平台支持
- 完整的API接口

[查看 API 详细文档](./api.md)

### @langgraph-js/bundler

用于构建 LangGraph 应用的构建器，能够将整个项目打包为单独的执行脚本。这简化了部署流程，使应用能够在不同环境中一致运行。主要优势：

- 项目打包为独立执行脚本
- 优化的构建过程
- 支持不同运行环境的配置

[查看 Bundler 详细文档](bundler.md)

### @langgraph-js/ui

便捷的调试界面，可以对接任何一个兼容 LangGraph 的后端。它具有丰富的功能，包括：

- 权限验证系统
- 历史管理功能
- 工具显示和调试能力
- 用户友好的界面

[查看 UI 详细文档](ui.md)

## 特点

- **开源私有化**：完全开源，可以在私有环境中部署和运行
- **持久化存储**：使用 PostgreSQL 进行数据持久化
- **全栈解决方案**：从前端到后端的完整技术栈支持
- **灵活部署**：支持多种部署方式和平台
- **开发者友好**：提供全面的工具和界面，简化开发流程

## 开始使用

要开始使用 LangGraph Server，请参考各个组件的详细文档：

- [@langgraph-js/sdk 文档](../sdk/index.md)
- [@langgraph-js/api 文档](api.md)
- [@langgraph-js/bundler 文档](bundler.md)
- [@langgraph-js/ui 文档](ui.md)
- [多平台部署指南](deployment/index.md)
  - [Node.js 部署](deployment/node.md)
  - [Deno 部署](deployment/deno.md)
  - [Bun 部署](deployment/bun.md)

## 社区和贡献

LangGraph 是一个开源项目，欢迎社区贡献。您可以通过以下方式参与：

- 提交 Bug 报告和功能请求
- 贡献代码和文档
- 分享您使用 LangGraph 构建的应用
- 参与讨论和帮助其他开发者
