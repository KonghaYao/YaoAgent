import { createUITool, ToolManager } from "@langgraph-js/sdk";
import Form, { IChangeEvent } from "@rjsf/core";
import ErrorBoundary from "../components/ErrorBoundary";
import { FileText } from "lucide-react";
import { z } from "zod";
import validator from "@rjsf/validator-ajv8";

export const show_form = createUITool({
    name: "show_form",
    description: "显示动态表单，等待用户填写",
    parameters: {
        schema: z.any(),
    },
    onlyRender: false,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        const data = tool.getInputRepaired();
        const output = tool.getJSONOutputSafe();
        const formSchema = data.schema;

        const handleSubmit = (formData: any) => {
            console.log("Form submitted:", formData);
            tool.response(formData);
        };

        return (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-1.5 text-gray-700 mb-3 font-bold">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>AI 表单</span>
                </div>
                <ErrorBoundary>
                    <Form
                        readonly={tool.state === "done"}
                        schema={formSchema}
                        formData={output}
                        onSubmit={(data: IChangeEvent<any>) => handleSubmit(data.formData)}
                        validator={validator}
                        onError={(errors) => {
                            console.error("表单校验错误:", errors);
                            alert("表单填写有误，请检查后再提交。");
                        }}
                    >
                        <div className="flex gap-2 mt-4">
                            <button
                                type="submit"
                                className="px-2 py-1 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                            >
                                提交
                            </button>
                        </div>
                    </Form>
                </ErrorBoundary>
            </div>
        );
    },
});
