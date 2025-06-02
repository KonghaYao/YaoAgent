import { ReactFlow, Background, Controls, Node, Edge, ReactFlowProvider, useNodesState, useEdgesState, useReactFlow, Panel } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useCallback, useEffect } from "react";
import { useChat } from "../chat/context/ChatContext";
import Dagre from "@dagrejs/dagre";
import { flattenGraph } from "./flattenGraph";
import { AssistantGraph } from "@langgraph-js/sdk";
import "./flow.css";
const nodeTypes = {
    group: ({ data }: { data: any }) => (
        <div className="absolute bottom-full left-0">
            <span>{data.name}</span>
        </div>
    ),
};

const transformEdges = (edges: AssistantGraph["edges"], nodes: Node[]): Edge[] => {
    const newEdges = edges.map((edge): Edge => {
        const sourceNode = nodes.find((n) => n.id === edge.source.toString());
        const targetNode = nodes.find((n) => n.id === edge.target.toString());
        const sourceId = sourceNode?.id;
        const targetId = targetNode?.id;
        return {
            id: `${sourceId}=${targetId}`,
            source: sourceId!,
            target: targetId!,
            animated: edge.conditional,
            label: edge.data,
            style: {
                stroke: edge.conditional ? "#2563eb" : "#64748b",
            },
        };
    });
    if (!newEdges.find((i) => i.target === "__end__")) {
        const end = [...nodes].reverse().find((i) => i.id.endsWith(":__end__"));
        if (end) {
            newEdges.push({
                id: `${end.id}=__end__`,
                source: end.id,
                target: "__end__",
                type: "smoothstep",
            });
        }
    }
    return newEdges;
};

const LayoutFlow = () => {
    const { fitView } = useReactFlow();
    const { graphVisualize, currentNodeName } = useChat();
    const graphData = graphVisualize || { nodes: [], edges: [] };

    const initialNodes = flattenGraph(graphData.nodes.map((node) => ({ ...node, type: "default" })));
    const initialEdges = transformEdges(graphData.edges, initialNodes);

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const onLayout = useCallback(
        (direction: "TB" | "LR") => {
            const layouted = getLayoutedElements(nodes, edges, { direction });
            setNodes([...layouted.nodes]);
            setEdges([...layouted.edges]);
            fitView();
        },
        [nodes, edges]
    );

    useEffect(() => {
        if (graphData.nodes.length > 0) {
            const layouted = getLayoutedElements(initialNodes, initialEdges, { direction: "TB" });
            setNodes([...layouted.nodes]);
            setEdges([...layouted.edges]);
            fitView();
        }
    }, [graphData]);
    useEffect(() => {
        const index = nodes.findIndex((i) => i.id.endsWith(currentNodeName));
        if (index !== -1) {
            const newNodes = [...nodes].map((i) => ({ ...i, selected: false }));
            newNodes[index] = { ...newNodes[index], selected: true };
            setNodes(newNodes);
            fitView();
        }
    }, [currentNodeName]);
    return (
        <div className="w-1/3 h-full relative overflow-hidden border-l">
            <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} fitView className="w-full h-full" nodeTypes={nodeTypes}>
                <Background />
                <Controls />
                <Panel position="top-right" className="flex gap-2">
                    <button onClick={() => onLayout("TB")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        垂直布局
                    </button>
                    <button onClick={() => onLayout("LR")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        水平布局
                    </button>
                </Panel>
            </ReactFlow>
        </div>
    );
};

const getLayoutedElements = (nodes: Node[], edges: Edge[], options: { direction: "TB" | "LR" }) => {
    const g = new Dagre.graphlib.Graph({ compound: true, multigraph: true }).setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir: options.direction, nodesep: 40, ranksep: 40, edgesep: 20 });

    nodes.forEach((node) => {
        if (node.type === "group") {
            return;
        }
        g.setNode(node.id, {
            ...node,
            width: 128,
            height: 20,
        });
    });
    edges.forEach((edge) => g.setEdge(edge.source, edge.target));

    Dagre.layout(g);
    const newNodes = nodes.map((node) => {
        const position = g.node(node.id);
        if (!position) return { ...node };
        let x = 0;
        let y = 0;

        x = position.x + (position?.width ?? 0);
        y = position.y + (position?.height ?? 0);

        return {
            ...node,
            position: { x, y },
            _p: position,
            width: position.width,
            height: position.height,
        };
    });

    const children = new Map<string, Node[]>();
    const padding = 15;
    [...newNodes].reverse().forEach((node) => {
        if (node.type === "group") {
            const nodes = children.get(node.id!) || [];
            const minX = Math.min(...nodes.map((i) => i.position.x));
            const minY = Math.min(...nodes.map((i) => i.position.y));
            const maxX = Math.max(...nodes.map((i) => i.position.x + (i.width ?? 0)));
            const maxY = Math.max(...nodes.map((i) => i.position.y + (i.height ?? 0)));
            node.position.x = minX - padding;
            node.position.y = minY - padding;
            node.width = maxX - minX + padding * 2;
            node.height = maxY - minY + padding * 2;
            nodes.forEach((i) => {
                i.position.x = i.position.x - node.position.x;
                i.position.y = i.position.y - node.position.y;
            });
        }
        if (node.parentId) {
            children.set(node.parentId!, [...(children.get(node.parentId!) ?? []), node]);
        }
    });
    return {
        nodes: newNodes,
        edges,
    };
};

export function Graph() {
    return (
        <ReactFlowProvider>
            <LayoutFlow />
        </ReactFlowProvider>
    );
}
