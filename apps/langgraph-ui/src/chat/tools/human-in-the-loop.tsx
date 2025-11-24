import { ArtifactCommand, createUITool, ToolManager, ToolRenderData } from "@langgraph-js/sdk";
import { FileIcon } from "lucide-react";
import { useChat } from "@langgraph-js/sdk/react";

export const __default_tool__ = createUITool({
    name: "__default__",
    description: "any",
    parameters: {},
    onlyRender: false,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const data = tool.getInputRepaired();
        const interrupt_data = tool.client.humanInTheLoop!;
        console.log(interrupt_data);
        return <div className="p-4 space-y-4"></div>;
    },
});
