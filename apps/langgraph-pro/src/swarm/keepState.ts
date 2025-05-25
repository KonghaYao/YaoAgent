import { Command } from "@langchain/langgraph";
import { SwarmState } from "@langchain/langgraph-swarm";
/**
 * 保留 Swarm 架构在 handoff 时丢失的 state
 * @example
 * const coordinator_agent = createReactAgent({
 *     name: "coordinator",
 *     llm,
 *     tools: [createHandoffTool({ agentName: "planner", description: "制定计划", updateState: keepAllStateInHandOff })],
 *     prompt: "",
 * });
 */
export const keepAllStateInHandOff = (state: typeof SwarmState.State) => {
    // omit activeAgent and messages
    const { activeAgent, messages, ...rest } = state;
    return {
        ...rest,
    };
};
/** 创建一个命令，可以跳转到 Swarm 架构内的指定节点 */
export const createHandoffCommand = <T>(name: string, state: T) => {
    return new Command({
        goto: name,
        graph: Command.PARENT,
        update: {
            active_agent: name,
            ...state,
        },
    });
};
