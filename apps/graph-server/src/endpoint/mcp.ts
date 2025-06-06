import { Annotation, GraphBubbleUp, LangGraphRunnableConfig } from "@langchain/langgraph";
import { StructuredToolInterface } from "@langchain/core/tools";
import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { createState } from "@langgraph-js/pro";
interface MCPConfig {
    name: string;
    url: string;
    headers: Record<string, string>;
    transport: "http";
}
export const McpState = createState().build({
    mcpConfig: Annotation<MCPConfig[]>(),
});

// Create client and connect to server
export const createMCPNode = <State extends typeof McpState.State, Config = LangGraphRunnableConfig, Output = unknown>(
    config: ConstructorParameters<typeof MultiServerMCPClient>[0]["mcpServers"],
    nodeFn: (state: State, config: Config, tools: StructuredToolInterface[]) => Output
) => {
    return async (state: State, Config: Config): Promise<Output> => {
        try {
            const switchOfTools = state.mcpConfig || {};
            // console.log(tools);

            const MCPTools = new MultiServerMCPClient({
                throwOnLoadError: false,
                prefixToolNameWithServerName: false,
                additionalToolNamePrefix: "",
                mcpServers: Object.fromEntries(switchOfTools.map((config) => [config.name, config])),
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
