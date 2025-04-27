// Main graph
import { START, StateGraph, END, LangGraphRunnableConfig } from "@langchain/langgraph";
import { createMCPNode } from "./tools/mcp.js";
import { initializeTools } from "./tools/index.js";
import { GraphState, ConfigurationState } from "./state.js";
import { createLLM } from "./llm.js";
import { SystemMessage } from "@langchain/core/messages";
import { MemoryPrompt } from "./tools/memory.js";
import { createExpert } from "src/create_expert/index.js";
import { simpleImageRecognition } from "src/multimodal/image.js";

const mainNode = createMCPNode<GraphState, LangGraphRunnableConfig<ConfigurationState>>(
    {
        npm: {
            transport: "sse",
            url: "http://0.0.0.0:6798/npm_bot/sse",
            useNodeEventSource: true,
        },
        thinking_tools: {
            transport: "sse",
            url: "http://0.0.0.0:6798/thinking_tools/sse",
            useNodeEventSource: true,
        },
    },
    async (state, config, mcpTools) => {
        // const tools = initializeTools(config);
        const normalTools = initializeTools(state, config);
        // console.log(mcpTools);
        const tools = [...normalTools, ...mcpTools];
        const llm = await createLLM("gpt-4.1-mini");
        const agent = createExpert({
            plannerConfig: {
                llm,
                tools,
                stateModifier: new SystemMessage(`你是一个专业的AI助手，擅长通过系统化的思考来编写任务文本。
你的任务是根据用户的问题，制定清晰的解决步骤和计划。

请遵循以下原则：
1. 仔细分析用户的问题，理解其核心需求
2. 制定清晰的解决步骤和计划
3. 合理使用工具来获取必要信息
4. 确保回答准确、专业且易于理解

${MemoryPrompt}`),
            },
            executorConfig: {
                llm,
                tools,
                stateModifier: new SystemMessage(`你是一个专业的AI助手，擅长执行具体的任务。

请遵循以下原则：
1. 严格按照计划执行任务
2. 使用合适的工具获取和处理信息
3. 提供清晰、准确的回答
4. 保持专业和友好的态度

${MemoryPrompt}`),
            },
        });
        const response = await agent.invoke({
            messages: state.messages,
        });

        return { messages: response.messages };
    }
);

export const builder = new StateGraph(GraphState, ConfigurationState)
    .addNode("main", mainNode)
    .addNode("image", simpleImageRecognition)
    .addEdge(START, "image")
    .addEdge("image", "main")
    .addEdge("main", END);

export const graph = builder.compile();
graph.name = "MemoryAgent";
