import { GraphBubbleUp, LangGraphRunnableConfig } from "@langchain/langgraph";
import { StructuredToolInterface } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";

// Create client and connect to server
export const createMCPNode = <State, Config = LangGraphRunnableConfig, Output = unknown>(
    config: ConstructorParameters<typeof MultiServerMCPClient>[0]["mcpServers"],
    nodeFn: (state: State, config: Config, tools: StructuredToolInterface[]) => Output
) => {
    const MCPTools = new MultiServerMCPClient({
        throwOnLoadError: false,
        prefixToolNameWithServerName: false,
        additionalToolNamePrefix: "",
        mcpServers: config as any,
    });
    return async (state: State, Config: Config): Promise<Output> => {
        try {
            const tools = await MCPTools.getTools();
            const answer = await nodeFn(state, Config, tools);
            await MCPTools.close();
            return answer;
        } catch (e) {
            if (e instanceof GraphBubbleUp) {
                throw e;
            }
            console.error(e as any);
            return nodeFn(state, Config, []);
        }
    };
};
