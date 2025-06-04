import { ToolManager, ToolRenderData, createToolUI } from "@langgraph-js/sdk";
import { FileEdit, Globe, Brain } from "lucide-react";

interface Step {
    need_web_search: boolean;
    title: string;
    description: string;
    step_type: "research" | "processing";
    execution_res?: string;
}

interface Plan {
    locale: string;
    has_enough_context: boolean;
    thought: string;
    title?: string;
    steps: Step[];
}

export const update_plan = createToolUI({
    name: "update_plan",
    description: "展示当前执行计划，等待用户确认",
    parameters: [],
    onlyRender: true,
    render(tool: ToolRenderData<Plan, string>) {
        const data = tool.getInputRepaired();
        const plan = data || {
            locale: "zh-CN",
            has_enough_context: false,
            thought: "",
            steps: [],
        };

        return (
            <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-1.5  text-gray-700 mb-2 font-bold">
                    <FileEdit className="w-3.5 h-3.5 text-blue-500" />
                    <span>执行计划</span>
                </div>

                <div className="space-y-2">
                    {plan.title && (
                        <div className="text-sm">
                            <span className="text-gray-500">标题：</span>
                            <span>{plan.title}</span>
                        </div>
                    )}

                    {plan.thought && (
                        <div className="text-sm">
                            <span className="text-gray-500">思考：</span>
                            <span className="whitespace-pre-wrap">{plan.thought}</span>
                        </div>
                    )}

                    {plan.steps && plan.steps.length > 0 && (
                        <div className="space-y-1.5">
                            <div className="text-sm text-gray-500">步骤：</div>
                            {plan.steps.map((step, index) => (
                                <div key={index} className="pl-2 border-l-2 border-gray-200">
                                    <div className="flex items-center gap-1.5 text-sm">
                                        {step!.step_type === "research" ? <Globe className="w-3.5 h-3.5 text-blue-500" /> : <Brain className="w-3.5 h-3.5 text-purple-500" />}
                                        <span className="font-medium">{step!.title}</span>
                                        {step!.need_web_search && <span className="text-xs text-blue-500">[搜索]</span>}
                                    </div>
                                    <div className="text-sm text-gray-600 pl-5">{step!.description}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    },
});
