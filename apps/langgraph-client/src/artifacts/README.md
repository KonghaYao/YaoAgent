# ArtifactViewer 实现说明

`ArtifactViewer` 组件主要负责与 `langgraph-js` SDK 的状态同步，并集成 `ai-artifacts` Web Component 来展示 AI 生成的内容。

## 核心功能

1.  **状态同步**: 监听 `useChat` hook 中的 `artifacts` 变化。
2.  **沙箱渲染**: 使用 `<ai-artifacts>` Web Component 加载远程渲染引擎。
3.  **交互反馈**: 通过 `eventCenter` 捕获沙箱内的 `sendBackToAI` 事件，支持 Human-in-the-loop 流程。

## 核心实现步骤

### 1. 同步 Artifacts 状态

利用 `useEffect` 监听 SDK 的 `artifacts` 和 `loading` 状态。当数据更新且加载完成后，使用 `setArtifactStore` 将数据推送到 `ai-artifacts` 的全局存储中。

```typescript
useEffect(() => {
    if (loading) return;
    setArtifactStore({
        artifacts: { default: artifacts as ArtifactType[] },
    });
}, [artifacts, loading]);
```

### 2. 集成渲染引擎 (Web Component)

在 JSX 中使用 `ai-artifacts` 标签。需要提供 `src` (渲染引擎地址)、`store-id` (默认为 `default`) 以及当前选中的 `group-id` 和 `version-id`。

```tsx
<ai-artifacts src={artifactsUrl} store-id="default" group-id={currentArtifactId?.[0] || ""} version-id={currentArtifactId?.[1] || ""} className="w-full min-h-[400px]"></ai-artifacts>
```

### 3. 事件处理 (Human-in-the-loop)

监听来自渲染沙箱的 `sendBackToAI` 事件。这通常发生在用户点击“修复”或“修改”按钮时，将相关的错误信息或修改建议传回给 AI。

```typescript
useEffect(() => {
    const handleSendBackToAI = (data: any) => {
        onSendBackToAI(data);
    };
    eventCenter.on("sendBackToAI", handleSendBackToAI);
    return () => {
        eventCenter.off("sendBackToAI", handleSendBackToAI);
    };
}, [onSendBackToAI]);
```

### 4. TypeScript 声明

为了让 React 识别自定义的 Web Component 标签，需要添加类型声明：

```typescript
declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "ai-artifacts": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                "store-id"?: string;
                "group-id"?: string;
                "version-id"?: string;
            };
        }
    }
}
```

## 配置项

- `artifactsUrl`: 渲染沙箱的 URL 地址，建议通过 `localStorage` 或环境变量进行配置，以便灵活切换（例如：`https://langgraph-artifacts.netlify.app/`）。
