// Copyright (c) 2025 Bytedance Ltd. and/or its affiliates
// SPDX-License-Identifier: MIT

import { RunnableConfig } from "@langchain/core/runnables";

type MCPSettings = {
    servers: Record<
        string,
        {
            transport: number;
            command: string;
            args: any;
            url: string;
            env: Record<string, string>;
            enabled_tools: string[];
            add_to_agents: string[];
        }
    >;
};
class Configuration {
    /**
     * The configurable fields.
     */
    maxPlanIterations: number = 1; // Maximum number of plan iterations
    maxStepNum: number = 3; // Maximum number of steps in a plan
    mcpSettings?: MCPSettings = {
        servers: {},
    }; // MCP settings, including dynamic loaded tools

    /**
     * Create a Configuration instance with specified parameters.
     */
    constructor(
        params: {
            maxPlanIterations?: number;
            maxStepNum?: number;
            mcpSettings?: MCPSettings;
        } = {}
    ) {
        if (params.maxPlanIterations !== undefined) {
            this.maxPlanIterations = params.maxPlanIterations;
        }
        if (params.maxStepNum !== undefined) {
            this.maxStepNum = params.maxStepNum;
        }
        if (params.mcpSettings !== undefined) {
            this.mcpSettings = params.mcpSettings;
        }
    }

    /**
     * Create a Configuration instance from a RunnableConfig.
     */
    static fromRunnableConfig(config?: RunnableConfig): Configuration {
        const configurable = config?.configurable || {};

        const values: Record<string, any> = {};

        // This simulates Python's approach of checking environment variables
        // and falling back to the configurable values
        if (process.env.MAX_PLAN_ITERATIONS || configurable.maxPlanIterations) {
            values.maxPlanIterations = process.env.MAX_PLAN_ITERATIONS
                ? Number(process.env.MAX_PLAN_ITERATIONS)
                : configurable.maxPlanIterations;
        }

        if (process.env.MAX_STEP_NUM || configurable.maxStepNum) {
            values.maxStepNum = process.env.MAX_STEP_NUM ? Number(process.env.MAX_STEP_NUM) : configurable.maxStepNum;
        }

        if (process.env.MCP_SETTINGS || configurable.mcpSettings) {
            values.mcpSettings = process.env.MCP_SETTINGS
                ? JSON.parse(process.env.MCP_SETTINGS)
                : configurable.mcpSettings;
        }

        return new Configuration(values);
    }
}

export { Configuration, RunnableConfig };
export enum SearchEngine {
    TAVILY = "tavily",
    DUCKDUCKGO = "duckduckgo",
    BRAVE_SEARCH = "brave_search",
    ARXIV = "arxiv",
}

// Tool configuration
export const SELECTED_SEARCH_ENGINE = process.env.SEARCH_API || SearchEngine.TAVILY;
export const SEARCH_MAX_RESULTS = 3;
