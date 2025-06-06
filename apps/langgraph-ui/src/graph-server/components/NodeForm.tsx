import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { JSONNodeSchema } from "../types";
import { useGlobal } from "../context/GlobalContext";

interface NodeFormProps {
    node?: JSONNodeSchema;
    onSave: (node: JSONNodeSchema) => void;
    onCancel: () => void;
}

interface FormData {
    name: string;
    type: "react_agent" | "swarm_agent";
    prompt?: string;
    llm?: string;
    tools?: {
        name: string;
    }[];
    agents?: string[];
}

export function NodeForm({ node, onSave, onCancel }: NodeFormProps) {
    const { state } = useGlobal();
    const [formData, setFormData] = useState<FormData>({
        name: "",
        type: "react_agent",
        prompt: "",
        llm: "",
        tools: [],
        agents: []
    });

    useEffect(() => {
        if (node) {
            setFormData({
                name: node.name,
                type: node.type,
                prompt: node.prompt || "",
                llm: node.llm || "",
                tools: node.tools || [],
                agents: node.agents || []
            });
        }
    }, [node]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="h-full flex flex-col bg-white border-l border-gray-200">
            {/* 头部 */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">{node ? "编辑节点" : "添加节点"}</h2>
                    <button 
                        onClick={onCancel} 
                        className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* 表单内容 */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* 基本信息 */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700">基本信息</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">节点名称</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">节点类型</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as "react_agent" | "swarm_agent" })}
                                    className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                >
                                    <option value="react_agent">ReAct Agent</option>
                                    <option value="swarm_agent">Swarm Agent</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ReAct Agent 配置 */}
                    {formData.type === "react_agent" && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700">ReAct Agent 配置</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">提示词</label>
                                    <textarea
                                        value={formData.prompt}
                                        onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                        className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">LLM</label>
                                    <select
                                        value={formData.llm || ""}
                                        onChange={(e) => setFormData({ ...formData, llm: e.target.value })}
                                        className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                        required
                                    >
                                        <option value="">选择模型</option>
                                        {state.models.map((model) => (
                                            <option key={model.id} value={model.id}>
                                                {model.name} ({model.provider})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">工具</label>
                                    <select
                                        multiple
                                        value={formData.tools?.map(tool => tool.name) || []}
                                        onChange={(e) => {
                                            const selectedTools = Array.from(e.target.selectedOptions, option => option.value);
                                            setFormData({ ...formData, tools: selectedTools.map(tool => ({ name: tool })) });
                                        }}
                                        className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                        size={4}
                                    >
                                        {state.tools.map((tool) => (
                                            <option key={tool.id} value={tool.id}>
                                                {tool.name}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="mt-1 text-sm text-gray-500">按住 Ctrl 键多选</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Swarm Agent 配置 */}
                    {formData.type === "swarm_agent" && (
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700">Swarm Agent 配置</h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">代理列表</label>
                                <select
                                    multiple
                                    value={formData.agents || []}
                                    onChange={(e) => {
                                        const selectedAgents = Array.from(e.target.selectedOptions, option => option.value);
                                        setFormData({ ...formData, agents: selectedAgents });
                                    }}
                                    className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                    size={4}
                                    required
                                >
                                    {state.tools.map((tool) => (
                                        <option key={tool.id} value={tool.id}>
                                            {tool.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-sm text-gray-500">按住 Ctrl 键多选</p>
                            </div>
                        </div>
                    )}
                </div>
            </form>

            {/* 底部按钮 */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
    );
} 