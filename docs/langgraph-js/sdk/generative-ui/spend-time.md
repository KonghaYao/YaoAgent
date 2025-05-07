# ⏳ 耗时显示

> LangGraph 官方并未实现单个 message 的时间记录信息，这个追踪的能力被放置到了 LangSmith 中。
>
> 但这个设计是不合理的，作为创建时间的基础信息应该放置在 Message 中，便于用户和开发者进行回查。
>

@langgraph-js/sdk 中，支持一种取巧的方式实现 Message 的时间记录。

实现耗时显示需要修改 LangGraph 源代码，比较复杂。

修改之后，时间数据可以随 Message 持久化，SDK 也可以通过 `response_metadata.create_time` 属性来获取创建时间。

## Patch langchain 依赖源码

核心功能是往 Message 里面添加 `create_time`, 并让其能够持久化。

1. package.json 文件中添加一行安装依赖触发的代码。

```json
"scripts":{
    "preinstall": "node patch_deps.mjs",
}
```

2. 根目录创建一个修补文件 `patch_deps.mjs` ，重新 `pnpm i` 安装依赖即可。

```js
// patch_deps.mjs
import fs from "fs";

const baseFile = fs.readFileSync("./node_modules/@langchain/core/dist/messages/base.js", "utf-8");

if (!baseFile.includes(`key === "create_time"`)) {
    const newFile = baseFile.replace(`key === "type"`, `key === "type" || key === "create_time"`);
    fs.writeFileSync("./node_modules/@langchain/core/dist/messages/base.js", newFile);
    console.log("mjs; 修改 langchain 源码，添加 create_time 属性成功");
}

const baseCjsFile = fs.readFileSync("./node_modules/@langchain/core/dist/messages/base.cjs", "utf-8");

if (!baseCjsFile.includes(`key === "create_time"`)) {
    const newFile = baseCjsFile.replace(`key === "type"`, `key === "type" || key === "create_time"`);
    fs.writeFileSync("./node_modules/@langchain/core/dist/messages/base.cjs", newFile);
    console.log("mjs; 修改 langchain 源码，添加 create_time 属性成功");
}

// 修改 langchain 源码，添加 create_time 属性

const file = fs.readFileSync("./node_modules/@langchain/core/dist/messages/base.js", "utf-8");

// 往 BaseMessage 的构造函数中添加一行 this.response_metadata. create_time = new Date().toISOString();
if (!file.includes("new Date().toISOString()")) {
    const newFile = file.replace(`this.id = fields.id;`, `this.id = fields.id;\nthis.response_metadata.create_time =this.response_metadata.create_time || new Date().toISOString();`);
    fs.writeFileSync("./node_modules/@langchain/core/dist/messages/base.js", newFile);
    console.log("mjs; 修改 langchain 源码，添加 create_time 属性成功");
}
const cfile = fs.readFileSync("./node_modules/@langchain/core/dist/messages/base.cjs", "utf-8");

// 往 BaseMessage 的构造函数中添加一行 this.response_metadata. create_time = new Date().toISOString();
if (!cfile.includes("new Date().toISOString()")) {
    const newFile = cfile.replace(`this.id = fields.id;`, `this.id = fields.id;\nthis.response_metadata.create_time = this.response_metadata.create_time || new Date().toISOString();`);
    fs.writeFileSync("./node_modules/@langchain/core/dist/messages/base.cjs", newFile);
    console.log("cjs; 修改 langchain 源码，添加 create_time 属性成功");
}
```

## 在 UI 中显示耗时

您可以在消息组件中显示耗时信息,@langgraph-js/sdk  已经帮你聚合好了时间相关的信息，使用 `message.spend_time` 显示即可

```jsx
import { formatTime } from "@langgraph-js/sdk";

const MessageComponent = ({ message }) => {
  return (
    <div className="message">
      <div className="message-content">{message.content}</div>
      
      {message.spend_time && (
        <div className="message-metadata">
          <span className="time-spent">
            耗时: {formatTime(message.spend_time)}
          </span>
        </div>
      )}
    </div>
  );
};
```
