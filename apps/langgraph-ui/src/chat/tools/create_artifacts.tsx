import { ArtifactCommand, createUITool, ToolRenderData } from "@langgraph-js/sdk";
import { FileIcon } from "lucide-react";
import { useChat } from "@langgraph-js/sdk/react";

export const create_artifacts = createUITool({
    name: "create_artifacts",
    description: "创建并保存代码文件到 artifacts 目录",
    parameters: {},
    onlyRender: true,
    render(tool: any) {
        const data: ArtifactCommand = tool.getInputRepaired();
        const { setCurrentArtifactById, setShowArtifact } = useChat();

        const toggleExpand = () => {
            setCurrentArtifactById(data.id, tool.message.id!);
            setShowArtifact(true);
        };

        return (
            <div className="p-4 space-y-4">
                <div className="text-sm text-gray-500">创建文件: {data.title}</div>
                <div className="border rounded-lg p-2 hover:bg-gray-50">
                    <div className="flex items-center justify-between select-none cursor-pointer" onClick={toggleExpand}>
                        <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4" />
                            <span className="font-xs">{data.title}</span> version: {data.id}
                        </div>
                    </div>
                </div>
            </div>
        );
    },
});
