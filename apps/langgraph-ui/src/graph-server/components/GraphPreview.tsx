import type { JSONGraphSchema } from "../types";

interface GraphPreviewProps {
    graph: JSONGraphSchema;
}

export function GraphPreview({ graph }: GraphPreviewProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">图结构预览</h2>
                <div className="space-y-4">
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">入口节点</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {graph.start_node || "未设置"}
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">节点数量</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {graph.nodes.length} 个节点
                        </p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-700">节点类型分布</h3>
                        <div className="mt-1 space-y-1">
                            <p className="text-sm text-gray-500">
                                ReAct Agent: {graph.nodes.filter(n => n.type === "react_agent").length} 个
                            </p>
                            <p className="text-sm text-gray-500">
                                Swarm Agent: {graph.nodes.filter(n => n.type === "swarm_agent").length} 个
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 