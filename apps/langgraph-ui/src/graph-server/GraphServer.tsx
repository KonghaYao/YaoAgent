import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Settings } from "lucide-react";
import { ChatMessages, ChatInput, Chat } from "../chat/Chat";
import { ExtraParamsProvider, useExtraParams } from "../chat/context/ExtraParamsContext";
import { ChatProvider, useChat } from "../chat/context/ChatContext";
import { NodeList } from "./components/NodeList";
import { NodeForm } from "./components/NodeForm";
import type { JSONGraphSchema, JSONNodeSchema, ExtraParams } from "./types";
import { GlobalProvider, useGlobal } from "./context/GlobalContext";
import { MCPConfigDialog } from "./components/MCPConfigDialog";

const DEFAULT_GRAPH: JSONGraphSchema = {
    nodes: [],
    start_node: "",
    mcp_config: [],
};

export const GraphEditor = () => {
    const [editingNode, setEditingNode] = useState<JSONNodeSchema | undefined>();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { extraParams, setExtraParams } = useExtraParams();
    const { state, updateMCPConfig } = useGlobal();
    const graph = (extraParams as ExtraParams).graph_schema || DEFAULT_GRAPH;
    const setGraph = (graphUpdate: (prev: JSONGraphSchema) => JSONGraphSchema) => {
        setExtraParams({ graph_schema: graphUpdate(graph) });
    };

    // 初始化时从 graph 加载 MCP 配置到全局状态
    useEffect(() => {
        if (graph && graph.mcp_config && graph.mcp_config.length > 0) {
            updateMCPConfig(graph.mcp_config);
            console.log("从 graph 加载 MCP 配置:", graph.mcp_config);
        }
    }, []);

    // 当 MCP 配置变更时更新 graph
    useEffect(() => {
        if (state.mcpConfig) {
            setGraph((prev) => ({
                ...prev,
                mcp_config: state.mcpConfig,
            }));
            console.log("保存 MCP 配置到 graph:", state.mcpConfig);
        }
    }, [state.mcpConfig]);

    const handleAddNode = () => {
        setEditingNode(undefined);
        setIsFormOpen(true);
    };

    const handleEditNode = (node: JSONNodeSchema) => {
        setEditingNode(node);
        setIsFormOpen(true);
    };

    const handleDeleteNode = (name: string) => {
        if (!graph) return;
        setGraph((prev) => ({
            ...prev,
            nodes: prev.nodes.filter((n) => n.name !== name),
            start_node: prev.start_node === name ? "" : prev.start_node,
        }));
    };

    const handleSaveNode = (node: JSONNodeSchema) => {
        if (!graph) return;
        setGraph((prev) => ({
            ...prev,
            nodes: prev.nodes.some((n) => n.name === node.name) ? prev.nodes.map((n) => (n.name === node.name ? node : n)) : [...prev.nodes, node],
        }));
        setIsFormOpen(false);
    };

    const handleStartNodeChange = (name: string) => {
        if (!graph) return;
        setGraph((prev) => ({
            ...prev,
            start_node: name,
        }));
    };
    // 在需要显示配置弹窗的组件中
    const [showMCPConfig, setShowMCPConfig] = useState(false);
    
    return (
        <div className="h-full flex flex-col bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">节点管理</h2>
                    <div className="flex items-center space-x-4">
                        <select
                            value={graph?.start_node || ""}
                            onChange={(e) => handleStartNodeChange(e.target.value)}
                            className="rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        >
                            <option value="">选择入口节点</option>
                            {graph?.nodes.map((node) => (
                                <option key={node.name} value={node.name}>
                                    {node.name}
                                </option>
                            ))}
                        </select>
                        {showMCPConfig && <MCPConfigDialog onClose={() => setShowMCPConfig(false)} />}
                        <button
                            onClick={() => setShowMCPConfig(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            MCP 配置{state.mcpConfig && state.mcpConfig.length > 0 && ` (${state.mcpConfig.length})`}
                        </button>
                        <button
                            onClick={handleAddNode}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            添加节点
                        </button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
                <NodeList nodes={graph?.nodes || []} onEdit={handleEditNode} onDelete={handleDeleteNode} />
            </div>
            {/* 编辑表单抽屉 */}
            {isFormOpen && (
                <div className="fixed inset-y-0 right-0 w-96 border-l border-gray-200 bg-white">
                    <NodeForm node={editingNode} onSave={handleSaveNode} onCancel={() => setIsFormOpen(false)} />
                </div>
            )}
        </div>
    );
};

export const ChatHeader = () => {
    const { createNewChat } = useChat();
    return (
        <div className="h-full bg-white rounded-lg border border-gray-200">
            <Chat>
                <div className="h-full flex flex-col">
                    <div className="flex justify-end  border-b border-gray-200  p-4">
                        <button className="text-sm text-gray-500 hover:text-gray-700" onClick={createNewChat}>
                            新对话
                        </button>
                    </div>
                    <ChatMessages />
                    <ChatInput />
                </div>
            </Chat>
        </div>
    );
};

export function GraphServer() {
    return (
        <GlobalProvider>
            <ChatProvider>
                <ExtraParamsProvider>
                    <div className="h-full flex">
                        {/* 右侧聊天区 */}
                        <div className="w-1/2 p-4">
                            <ChatHeader />
                        </div>
                        {/* 中间节点管理区 */}
                        <div className="flex-1 p-4">
                            <GraphEditor />
                        </div>
                    </div>
                </ExtraParamsProvider>
            </ChatProvider>
        </GlobalProvider>
    );
}
