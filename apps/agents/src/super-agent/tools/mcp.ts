import { Annotation, GraphBubbleUp, LangGraphRunnableConfig } from "@langchain/langgraph";
import { StructuredToolInterface } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createState } from "@langgraph-js/pro";
export const McpState = createState().build({
    mcpServers: Annotation<Record<string, boolean>>(),
});

// Create client and connect to server
export const createMCPNode = <State extends typeof McpState.State, Config = LangGraphRunnableConfig, Output = unknown>(
    config: ConstructorParameters<typeof MultiServerMCPClient>[0]["mcpServers"],
    nodeFn: (state: State, config: Config, tools: StructuredToolInterface[]) => Output
) => {
    return async (state: State, Config: Config): Promise<Output> => {
        try {
            const switchOfTools = state.mcpServers || {};
            // console.log(tools);
            const filteredConfig = Object.entries(config).filter(([key]) => {
                if (switchOfTools[key] === false) {
                    return false;
                }
                return true;
            });
            if (filteredConfig.length === 0) {
                return nodeFn(state, Config, []);
            }
            const MCPTools = new MultiServerMCPClient({
                throwOnLoadError: false,
                prefixToolNameWithServerName: false,
                additionalToolNamePrefix: "",
                mcpServers: Object.fromEntries(filteredConfig) as any,
            });
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
