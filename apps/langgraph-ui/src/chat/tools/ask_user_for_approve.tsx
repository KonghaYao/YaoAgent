import { ToolManager, ToolRenderData, createToolUI } from "@langgraph-js/sdk";
import { useState } from "react";

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
    render(tool: ToolRenderData<RenderResponse>) {
        const data = tool.input || {};
        const [feedback, setFeedback] = useState("");

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
            <div className="approval-prompt-compact">
                <div className="approval-header-compact">
                    <span>🔍请求审核批准</span>
                    {data.title && <span className="approval-title">{data.title}</span>}
                </div>

                <div className="feedback-input-compact">
                    <textarea
                        disabled={tool.state === "done"}
                        className="feedback-textarea-compact"
                        placeholder="反馈意见（可选）"
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        rows={1}
                    />

                    <button disabled={tool.state === "done"} className="approve-button-compact" onClick={handleApprove}>
                        ✅ 批准
                    </button>
                    <button disabled={tool.state === "done"} className="reject-button-compact" onClick={handleReject}>
                        ❌ 拒绝
                    </button>
                </div>
            </div>
        );
    },
});
