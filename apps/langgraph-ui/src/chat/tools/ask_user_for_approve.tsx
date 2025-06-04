import { ToolManager, ToolRenderData, createToolUI } from "@langgraph-js/sdk";
import { useState } from "react";
import { CheckCircle2, XCircle, Search } from "lucide-react";

interface RenderResponse {
    approved: boolean;
    feedback: string | null;
}

export const ask_user_for_approve = createToolUI({
    name: "ask_user_for_approve",
    description: "Request user review and approval for plans or content, wait for user feedback before proceeding",
    parameters: [
        {
            name: "title",
            type: "string",
            description: "Title or subject of the content to be reviewed",
        },
    ],
    onlyRender: true,
    handler: ToolManager.waitForUIDone,
    render(tool: ToolRenderData<{ title: string }, RenderResponse>) {
        const data = tool.getInputRepaired();
        const [feedback, setFeedback] = useState(tool.getJSONOutputSafe()?.feedback || "");

        const handleApprove = () => {
            const result = {
                approved: true,
                feedback: feedback.trim() || null,
            };
            tool.response(result);
        };

        const handleReject = () => {
            const result = {
                approved: false,
                feedback: feedback.trim() || "用户拒绝了请求",
            };
            tool.response(result);
        };

        return (
            <div className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 text-gray-700">
                    <Search className="w-4 h-4 text-blue-500" />
                    <span>请求审核批准</span>
                    {data.title && <span className="text-sm text-gray-500 ml-2 truncate max-w-[200px]">{data.title}</span>}
                </div>

                <div className="flex gap-2">
                    <textarea
                        disabled={tool.state === "done"}
                        className="flex-1 p-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                        placeholder="反馈意见（可选）"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={1}
                    />

                    <button
                        disabled={tool.state === "done"}
                        className="px-3 py-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        onClick={handleApprove}
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        批准
                    </button>
                    <button
                        disabled={tool.state === "done"}
                        className="px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        onClick={handleReject}
                    >
                        <XCircle className="w-4 h-4" />
                        拒绝
                    </button>
                </div>
            </div>
        );
    },
});
