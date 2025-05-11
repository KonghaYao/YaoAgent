import fs from "fs/promises";
import path from "path";

export const PREFIX =
    "# System context\n" +
    "You are part of a multi-agent system called the Agents SDK, designed to make agent " +
    "coordination and execution easy. Agents uses two primary abstraction: **Agents** and " +
    "**Handoffs**. An agent encompasses instructions and tools and can hand off a " +
    "conversation to another agent when appropriate. " +
    "Handoffs are achieved by calling a handoff function, generally named " +
    "`transfer_to_<agent_name>`. Transfers between agents are handled seamlessly in the background;" +
    " do not mention or draw attention to these transfers in your conversation with the user.\n";

export const getPrompt = async (relativePath: string, addPrefix = true) => {
    // 使用 process.cwd() 获取当前工作目录
    const fullPath = path.resolve(process.cwd() + process.env.PROMPT_PATH, relativePath);
    return (addPrefix ? PREFIX : "") + (await fs.readFile(fullPath, "utf-8"));
};
