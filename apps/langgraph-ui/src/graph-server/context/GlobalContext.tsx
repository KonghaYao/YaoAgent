import { createContext, useContext, useState, ReactNode } from "react";
import { MCPConfig } from "../types";

export interface Model {
    id: string;
    name: string;
    provider: string;
    description?: string;
    parameters?: Record<string, any>;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    parameters?: Record<string, any>;
    category?: string;
}

export interface GlobalState {
    models: Model[];
    tools: Tool[];
    selectedModel?: string;
    mcpConfig: MCPConfig[];
}

export interface GlobalContextType {
    state: GlobalState;
    addModel: (model: Model) => void;
    removeModel: (id: string) => void;
    updateModel: (id: string, model: Partial<Model>) => void;
    addTool: (tool: Tool) => void;
    updateTool: (id: string, tool: Partial<Tool>) => void;
    selectModel: (id: string) => void;
    selectTools: (ids: string[]) => void;
    updateMCPConfig: (configs: MCPConfig[]) => void;
}

const initialState: GlobalState = {
    models: [
        // gpt-4o-mini
        {
            id: "gpt-4o-mini",
            name: "gpt-4o-mini",
            provider: "openai",
        },
    ],
    tools: [
        {
            id: "SequentialThinkingTool",
            name: "SequentialThinkingTool",
            description: "SequentialThinkingTool",
        },
    ],
    mcpConfig: []
};

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export function GlobalProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<GlobalState>(initialState);

    const addModel = (model: Model) => {
        setState((prev) => ({
            ...prev,
            models: [...prev.models, model],
        }));
    };

    const removeModel = (id: string) => {
        setState((prev) => ({
            ...prev,
            models: prev.models.filter((m) => m.id !== id),
            selectedModel: prev.selectedModel === id ? undefined : prev.selectedModel,
        }));
    };

    const updateModel = (id: string, model: Partial<Model>) => {
        setState((prev) => ({
            ...prev,
            models: prev.models.map((m) => (m.id === id ? { ...m, ...model } : m)),
        }));
    };

    const addTool = (tool: Tool) => {
        setState((prev) => ({
            ...prev,
            tools: [...prev.tools, tool],
        }));
    };

    const updateTool = (id: string, tool: Partial<Tool>) => {
        setState((prev) => ({
            ...prev,
            tools: prev.tools.map((t) => (t.id === id ? { ...t, ...tool } : t)),
        }));
    };

    const selectModel = (id: string) => {
        setState((prev) => ({
            ...prev,
            selectedModel: id,
        }));
    };

    const selectTools = (ids: string[]) => {
        setState((prev) => ({
            ...prev,
            selectedTools: ids,
        }));
    };

    const updateMCPConfig = (configs: MCPConfig[]) => {
        setState((prev) => ({
            ...prev,
            mcpConfig: configs
        }));
    };

    const value: GlobalContextType = {
        state,
        addModel,
        removeModel,
        updateModel,
        addTool,
        updateTool,
        selectModel,
        selectTools,
        updateMCPConfig
    };

    return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
}

export function useGlobal() {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error("useGlobal must be used within a GlobalProvider");
    }
    return context;
}
