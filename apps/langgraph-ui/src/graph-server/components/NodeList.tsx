import { Pencil, Trash2 } from "lucide-react";
import type { JSONNodeSchema } from "../types";

interface NodeListProps {
    nodes: JSONNodeSchema[];
    onEdit: (node: JSONNodeSchema) => void;
    onDelete: (name: string) => void;
}

export function NodeList({ nodes, onEdit, onDelete }: NodeListProps) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">名称</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">提示词</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {nodes.map((node) => (
                        <tr key={node.name} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{node.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{node.type === "react_agent" ? "ReAct Agent" : "Swarm Agent"}</td>
                            <td className="px-6 py-4">
                                <div className="max-w-[300px] truncate text-sm text-gray-500" title={node.type === "react_agent" ? node.prompt : ""}>
                                    {node.type === "react_agent" ? node.prompt : "-"}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <button onClick={() => onEdit(node)} className="text-blue-500 hover:text-blue-700 mr-4 transition-colors">
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => onDelete(node.name)} className="text-red-500 hover:text-red-700 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
} 