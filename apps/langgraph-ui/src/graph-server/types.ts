export interface JSONNodeSchema {
    name: string;
    description?: string;
    tool?: string;
    agent?: string;
    llm?: string;
    next?: string[];
    tools?: string[];
    agents?: string[];
    params?: Record<string, any>;
    system_prompt?: string;
}

export interface MCPConfig {
    name: string;
    url: string;
    headers: Record<string, string>;
    transport: string;
}

export interface JSONGraphSchema {
    nodes: JSONNodeSchema[];
    start_node: string;
    mcp_config?: MCPConfig[];
}

export interface ExtraParams {
    graph_schema?: JSONGraphSchema;
}
