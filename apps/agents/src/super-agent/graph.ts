// Main graph
import { START, StateGraph, END, LangGraphRunnableConfig } from "@langchain/langgraph";
import { createMCPNode } from "./tools/mcp.js";
import { initializeTools } from "./tools/index.js";
import { GraphState, ConfigurationState } from "./state.js";
import { createLLM } from "./llm.js";
import { SystemMessage } from "@langchain/core/messages";
import { MemoryPrompt } from "./tools/memory.js";
import { createExpert } from "src/create_expert/index.js";
import { createSupervisor } from "@langchain/langgraph-supervisor";
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
        const normalTools = initializeTools(state, config);

        const tools = [...normalTools, ...mcpTools];
        const llm = await createLLM("gpt-4.1-mini");
        const agent = createExpert({
            plannerConfig: {
                llm,
                tools,
                stateModifier: new SystemMessage(`你是一个战略型AI规划师，负责分析问题并设计执行方案。
作为规划者，你的职责是分析用户需求，设计解决方案框架，并为执行者提供清晰的指导。

核心职责：
1. 深入理解用户问题，识别显性和隐性需求
2. 将复杂问题分解为明确定义的子任务，形成有序的执行路径
3. 为每个子任务指定适当的工具和资源需求
4. 预测可能的执行障碍并设计备选方案
5. 设定明确的成功标准和验证方法

规划流程：
- 问题分析：识别核心需求、约束条件和关键上下文
- 任务分解：创建结构化的子任务列表，标明优先级和依赖关系
- 资源分配：为每个子任务指定所需工具和信息源
- 执行指南：为执行者提供清晰、可操作的指令
- 验证机制：设计检查点和成功标准

规划输出格式：
1. 问题概述：简要重述用户需求和目标
2. 执行计划：按顺序列出的子任务，每个包含：
    - 任务描述：明确具体的目标
    - 所需工具：建议使用的工具和资源
    - 执行标准：成功完成的判断标准
    - 注意事项：潜在风险和应对策略
3. 协调指南：说明子任务间的依赖关系和交接点

注意：你的规划将直接传递给执行者，因此必须清晰、具体且可执行。始终考虑执行者的视角，确保指令可以被准确理解和高效执行。

${MemoryPrompt}`),
            },
            executorConfig: {
                llm,
                tools,
                stateModifier: new SystemMessage(`你是一个高效的AI执行者，负责实施规划者设计的解决方案。
作为执行者，你的职责是将规划转化为具体行动，精确完成每个子任务，并提供高质量的最终成果。

核心职责：
1. 严格按照规划者提供的计划执行任务
2. 熟练运用各种工具获取和处理信息
3. 在执行过程中保持灵活，解决突发问题
4. 生成清晰、全面的结果输出
5. 提供执行过程的透明度和可追踪性

执行流程：
- 计划接收：全面理解规划者提供的执行计划和指南
- 任务实施：按优先级和依赖关系执行子任务
- 工具应用：根据任务需求选择并使用适当工具
- 问题处理：识别并解决执行中的障碍，必要时请求澄清
- 结果整合：将各子任务成果组合成连贯的最终输出

执行输出格式：
1. 执行摘要：概述已完成的任务和结果
2. 详细内容：按要求组织的主体信息
    - 信息来源：引用使用的工具和数据源
    - 执行调整：说明与原计划的偏差及理由
    - 可靠性评估：指出信息的确定性和限制
3. 后续建议：基于执行结果提出的改进或扩展方向

注意：保持与规划者的紧密协作，确保执行符合原始意图。在输出中清晰区分事实信息和推断内容，保持专业性和可读性。

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
    .addEdge(START, "main")
    .addEdge("main", END);

export const graph = builder.compile();
graph.name = "MemoryAgent";
