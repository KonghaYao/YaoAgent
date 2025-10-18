import { createUITool, ToolRenderData } from "@langgraph-js/sdk";
import { FileIcon } from "lucide-react";
import { useArtifacts } from "../../artifacts/ArtifactsContext";

export const create_artifacts = createUITool({
    name: "create_artifacts",
    description: "创建并保存代码文件到 artifacts 目录",
    parameters: {},
    onlyRender: true,
    render(tool: any) {
        const data = tool.getInputRepaired();
        const { setCurrentArtifactById, currentArtifact } = useArtifacts();

        const toggleExpand = () => {
            setCurrentArtifactById(tool.message.id!);
        };

        return (
            <div className="p-4 space-y-4">
                <div className="text-sm text-gray-500">
                    创建文件: {data.filename}.{data.filetype}
                </div>
                <div className="border rounded-lg p-2 hover:bg-gray-50">
                    <div className="flex items-center justify-between select-none cursor-pointer" onClick={toggleExpand}>
                        <div className="flex items-center gap-2">
                            <FileIcon className="w-4 h-4" />
                            <span className="font-xs">{data.filename}</span>
                        </div>
                        <span className="text-gray-400">
                            {data.filetype} {currentArtifact?.id === tool.message.id ? "▼" : "▶"}
                        </span>
                    </div>
                </div>
            </div>
        );
    },
});
