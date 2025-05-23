import { SwarmState } from "@langchain/langgraph-swarm";
/**
 * 保留 langgraph-swarm 在 handoff 时丢失的 state
 */
export const keepAllStateInHandOff = (state: typeof SwarmState.State) => {
    // omit activeAgent and messages
    const { activeAgent, messages, ...rest } = state;
    return {
        ...rest,
    };
};
