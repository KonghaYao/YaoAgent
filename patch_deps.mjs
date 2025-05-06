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
