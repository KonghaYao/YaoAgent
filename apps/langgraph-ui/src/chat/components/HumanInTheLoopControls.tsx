import { ToolRenderData } from "@langgraph-js/sdk";

export const HumanInTheLoopControls = ({ tool }: { tool: ToolRenderData<any, any> }) => {
    const interruptData = tool.getHumanInTheLoopData();
    if (!interruptData) return null;

    const reviewConfig = interruptData.reviewConfig;
    const actionRequest = interruptData.actionRequest;
    if (!reviewConfig) return null;

    return (
        <div className="flex gap-2">
            {reviewConfig.allowedDecisions.map((decision) => {
                if (decision === "approve") {
                    return (
                        <button
                            key={decision}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors cursor-pointer"
                            onClick={() => tool.sendResumeData({ type: "approve" })}
                        >
                            Approve
                        </button>
                    );
                }
                if (decision === "reject") {
                    return (
                        <button
                            key={decision}
                            className="px-3 py-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                            onClick={() => {
                                const reason = window.prompt("Please enter rejection reason:");
                                if (reason !== null) {
                                    tool.sendResumeData({ type: "reject", message: reason ? reason : undefined });
                                }
                            }}
                        >
                            Reject
                        </button>
                    );
                }
                if (decision === "edit") {
                    return (
                        <button
                            key={decision}
                            className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                            onClick={() => {
                                const currentArgs = JSON.stringify(actionRequest.args);
                                const newArgs = window.prompt("Edit tool arguments (JSON):", currentArgs);
                                if (newArgs !== null) {
                                    try {
                                        const parsed = JSON.parse(newArgs);
                                        tool.sendResumeData({
                                            type: "edit",
                                            edited_action: {
                                                name: actionRequest.name,
                                                args: parsed,
                                            },
                                        });
                                    } catch (e) {
                                        alert("Invalid JSON");
                                    }
                                }
                            }}
                        >
                            Edit
                        </button>
                    );
                }
                return null;
            })}
        </div>
    );
};
