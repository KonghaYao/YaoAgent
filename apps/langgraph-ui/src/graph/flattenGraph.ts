import { AssistantGraph } from "@langgraph-js/sdk";
import { Node } from "@xyflow/react";

export function flattenGraph(graph: AssistantGraph["nodes"]) {
    const flatParents = new Map<string, Node>();
    const finalNodes: Node[] = [];
    const createParentNode = (node: Node) => {
        const parts = node.id.split(":");
        const parentId = parts.slice(0, -1).join(":");
        if (parts.length === 1) {
            return;
        }
        if (!flatParents.has(parentId)) {
            const parentNode: Node = {
                id: parentId,
                type: "group",
                data: {
                    label: parentId.split(":").pop(),
                    name: parentId.split(":").pop(),
                },
                position: { x: 0, y: 0 },
                style: {},
                parentId: undefined,
            };
            const p = createParentNode(parentNode);
            if (p) {
                parentNode.parentId = p.id;
            }
            flatParents.set(parentId, parentNode);
        }
        return flatParents.get(parentId);
    };

    graph.forEach((node) => {
        const flowNode: Node = { ...node, id: node.id.toString(), position: { x: 0, y: 0 }, data: { label: (node.id as string).split(":").pop(), name: (node.id as string).split(":").pop() } };
        const parentNode = createParentNode(flowNode);
        if (parentNode) {
            flowNode.parentId = parentNode.id.toString();
        }
        finalNodes.push(flowNode);
    });

    const data = [...Array.from(flatParents.values()), ...finalNodes];
    return data;
}
