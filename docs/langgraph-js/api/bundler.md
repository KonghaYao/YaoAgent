# @langgraph-js/bundler

@langgraph-js/bundler 是 LangGraph 生态系统中专门用于构建和打包 LangGraph 应用的工具。它能够将一个完整的 LangGraph 项目打包为单独的执行脚本，简化部署流程并确保应用在不同环境中的一致性。

## 特点

- **统一打包**：将所有依赖打包为单一执行文件，完全独立
- **优化构建**：优化构建过程，减小包体积并提升性能
- **多环境支持**：支持不同运行环境的配置和部署
- **无缝集成**：与 LangGraph 生态系统其他组件无缝集成

## 安装

```bash
npm install @langgraph-js/bundler --save-dev
# 或
yarn add @langgraph-js/bundler --dev
# 或
pnpm add @langgraph-js/bundler -D
```

## 基本用法

### 命令行使用

添加构建脚本到 `package.json`：

```json
{
  "scripts": {
    "build": "langgraph-bundler"
  }
}
```

### 运行构建

```bash
npm run build
```
