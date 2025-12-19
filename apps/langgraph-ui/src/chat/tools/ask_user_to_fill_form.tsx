import { createUITool, ToolManager } from "@langgraph-js/sdk";
import Form, { IChangeEvent } from "@rjsf/core";
import ErrorBoundary from "../components/ErrorBoundary";
import { FileText, Eye, EyeOff, ChevronDown, X, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { z } from "zod";
import validator from "@rjsf/validator-ajv8";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 错误信息显示组件
const ErrorMessage = ({ errors }: { errors?: string[] }) => {
    if (!errors || errors.length === 0) return null;
    return (
        <div className="flex items-start gap-1.5 mt-1">
            <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
            <span className="text-xs text-red-600">{errors[0]}</span>
        </div>
    );
};

// 自定义文本输入组件
const CustomTextWidget = (props: any) => {
    const hasMinLength = props.options?.minLength;
    const hasMaxLength = props.options?.maxLength;
    const currentLength = props.value?.length || 0;
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="text"
                className={cn(
                    "w-full rounded-lg border bg-gray-50/50 p-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all",
                    hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                )}
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
                disabled={props.disabled}
                maxLength={hasMaxLength ? props.options.maxLength : undefined}
            />
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
            {(hasMinLength || hasMaxLength) && (
                <div className="flex justify-end mt-1">
                    <span className={`text-xs ${currentLength > (props.options?.maxLength || 0) ? "text-red-500" : "text-gray-400"}`}>
                        {hasMinLength && hasMaxLength
                            ? `${currentLength}/${props.options.maxLength} (最少${props.options.minLength})`
                            : hasMaxLength
                              ? `${currentLength}/${props.options.maxLength}`
                              : `最少${props.options.minLength}字符`}
                    </span>
                </div>
            )}
        </div>
    );
};

// 自定义密码输入组件
const CustomPasswordWidget = (props: any) => {
    const [showPassword, setShowPassword] = useState(false);
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    className={cn(
                        "w-full rounded-lg border bg-gray-50/50 p-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all",
                        hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                    )}
                    value={props.value || ""}
                    onChange={(e) => props.onChange(e.target.value)}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义文本区域组件
const CustomTextareaWidget = (props: any) => {
    const hasMinLength = props.options?.minLength;
    const hasMaxLength = props.options?.maxLength;
    const currentLength = props.value?.length || 0;
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                className={cn(
                    "w-full rounded-lg border bg-gray-50/50 p-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all resize-none",
                    hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                )}
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
                disabled={props.disabled}
                rows={props.options?.rows || 4}
                maxLength={hasMaxLength ? props.options.maxLength : undefined}
            />
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
            {(hasMinLength || hasMaxLength) && (
                <div className="flex justify-end mt-1">
                    <span className={`text-xs ${currentLength > (props.options?.maxLength || 0) ? "text-red-500" : "text-gray-400"}`}>
                        {hasMinLength && hasMaxLength
                            ? `${currentLength}/${props.options.maxLength} (最少${props.options.minLength})`
                            : hasMaxLength
                              ? `${currentLength}/${props.options.maxLength}`
                              : `最少${props.options.minLength}字符`}
                    </span>
                </div>
            )}
        </div>
    );
};

// 自定义选择框组件
const CustomSelectWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    className={cn(
                        "w-full rounded-lg border bg-gray-50/50 p-2 pr-10 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all appearance-none",
                        hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                    )}
                    value={props.value || ""}
                    onChange={(e) => props.onChange(e.target.value)}
                    disabled={props.disabled}
                >
                    {props.placeholder && (
                        <option value="" disabled>
                            {props.placeholder}
                        </option>
                    )}
                    {props.options?.enumOptions?.map((option: any, index: number) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义多选框组件
const CustomCheckboxWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className={cn("space-y-2", hasError && "p-2 border border-red-200 rounded-lg bg-red-50/30")}>
                {props.options?.enumOptions?.map((option: any, index: number) => (
                    <label key={index} className="flex items-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                            checked={props.value?.includes(option.value) || false}
                            onChange={(e) => {
                                const currentValue = props.value || [];
                                if (e.target.checked) {
                                    props.onChange([...currentValue, option.value]);
                                } else {
                                    props.onChange(currentValue.filter((v: any) => v !== option.value));
                                }
                            }}
                            disabled={props.disabled}
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义单选按钮组件
const CustomRadioWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className={cn("space-y-2", hasError && "p-2 border border-red-200 rounded-lg bg-red-50/30")}>
                {props.options?.enumOptions?.map((option: any, index: number) => (
                    <label key={index} className="flex items-center">
                        <input
                            type="radio"
                            name={props.id}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2"
                            value={option.value}
                            checked={props.value === option.value}
                            onChange={(e) => props.onChange(e.target.value)}
                            disabled={props.disabled}
                        />
                        <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                    </label>
                ))}
            </div>
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义数字输入组件
const CustomNumberWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="number"
                className={cn(
                    "w-full rounded-lg border bg-gray-50/50 p-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all",
                    hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                )}
                value={props.value || ""}
                onChange={(e) => props.onChange(Number(e.target.value))}
                placeholder={props.placeholder}
                disabled={props.disabled}
                min={props.options?.min}
                max={props.options?.max}
                step={props.options?.step}
            />
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义滑块组件
const CustomRangeWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className={cn("px-2", hasError && "p-2 border border-red-200 rounded-lg bg-red-50/30")}>
                <input
                    type="range"
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    value={props.value || props.options?.min || 0}
                    onChange={(e) => props.onChange(Number(e.target.value))}
                    disabled={props.disabled}
                    min={props.options?.min || 0}
                    max={props.options?.max || 100}
                    step={props.options?.step || 1}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{props.options?.min || 0}</span>
                    <span className="font-medium text-blue-600">{props.value}</span>
                    <span>{props.options?.max || 100}</span>
                </div>
            </div>
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义日期选择器组件
const CustomDateWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="date"
                className={cn(
                    "w-full rounded-lg border bg-gray-50/50 p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all",
                    hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                )}
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                disabled={props.disabled}
            />
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义日期时间选择器组件
const CustomDateTimeWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="datetime-local"
                className={cn(
                    "w-full rounded-lg border bg-gray-50/50 p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all",
                    hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                )}
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                disabled={props.disabled}
            />
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义布尔值组件
const CustomBooleanWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            <div className={cn(hasError && "p-2 border border-red-200 rounded-lg bg-red-50/30")}>
                {props.label && (
                    <label className="flex items-center">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 mr-2"
                            checked={props.value || false}
                            onChange={(e) => props.onChange(e.target.checked)}
                            disabled={props.disabled}
                        />
                        <span className="text-sm text-gray-700">
                            {props.label}
                            {props.required && <span className="text-red-500 ml-1">*</span>}
                        </span>
                    </label>
                )}
            </div>
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1 ml-6">{props.description}</p>}
        </div>
    );
};

// 自定义文件上传组件
const CustomFileWidget = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;
    const handleFileChange = (e: any) => {
        const files = e.target.files;
        if (props.multiple) {
            // 多文件选择
            props.onChange(files);
        } else {
            // 单文件选择
            props.onChange(files?.[0] || null);
        }
    };

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="file"
                className={cn(
                    "w-full rounded-lg border bg-gray-50/50 p-2 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-all file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-blue-50 file:text-blue-700 file:rounded file:font-medium",
                    hasError ? "border-red-500 focus:ring-red-100 focus:border-red-500" : "border-gray-200 focus:ring-blue-100 focus:border-blue-400"
                )}
                onChange={handleFileChange}
                disabled={props.disabled}
                multiple={props.multiple}
                accept={props.accept}
            />
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义数组字段组件
const CustomArrayField = (props: any) => {
    const hasError = props.rawErrors && props.rawErrors.length > 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-900 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className={cn("space-y-2", hasError && "p-2 border border-red-200 rounded-lg bg-red-50/30")}>
                {props.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-start gap-2 p-3 border border-gray-200 rounded-lg">
                        <div className="flex-1">{item.children}</div>
                        <button type="button" className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded" onClick={() => props.onDropIndexClick(index)()}>
                            <X size={16} />
                        </button>
                    </div>
                ))}
                <button type="button" className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors" onClick={() => props.onAddClick()}>
                    <Plus size={14} />
                    添加项目
                </button>
            </div>
            <ErrorMessage errors={props.rawErrors} />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义字段模板
const CustomFieldTemplate = (props: any) => {
    return <div className={`${props.className} mb-4`}>{props.children}</div>;
};

// 自定义对象字段模板 - 默认竖向排列
const CustomObjectFieldTemplate = (props: any) => {
    return (
        <div className="mb-4">
            {props.title && <h3 className="text-sm font-medium text-gray-700 mb-2">{props.title}</h3>}
            <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                {props.properties.map((prop: any) => (
                    <div key={prop.name}>{prop.content}</div>
                ))}
            </div>
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义按钮组件
const CustomSubmitButton = (props: any) => {
    return (
        <Button
            type="submit"
            disabled={props.disabled}
            className={cn(
                "px-5 rounded-full transition-all duration-200",
                props.disabled ? "bg-gray-100 text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-200"
            )}
        >
            {props.submitText || "提交表单"}
        </Button>
    );
};

const AskUserToFillFormSchema = {
    title: z.string().describe("Form title"),
    description: z.string().optional().describe("Optional form description"),
    schema: z.record(z.string(), z.any()).describe("JSON Schema for the form (react-jsonschema-form compatible)"),
};

export const ask_user_to_fill_form = createUITool({
    name: "ask_user_to_fill_form",
    description: "Present a form to the user for filling out. Schema follows react-jsonschema-form format.",
    parameters: AskUserToFillFormSchema,
    onlyRender: false,
    handler: ToolManager.waitForUIDone,
    render(tool) {
        try {
            const data = tool.getInputRepaired();
            const output = tool.getJSONOutputSafe();
            const formSchema = data?.schema || {};
            const canInteract = tool.state === "interrupted" || tool.state === "loading";

            const handleSubmit = (formData: any) => {
                try {
                    tool.sendResumeData({
                        /** @ts-ignore */
                        type: "respond",
                        message: JSON.stringify(formData),
                    });
                } catch (error) {
                    console.error("提交表单数据时出错:", error);
                }
            };

            // 自定义控件配置
            const customWidgets = {
                text: CustomTextWidget,
                password: CustomPasswordWidget,
                textarea: CustomTextareaWidget,
                select: CustomSelectWidget,
                checkboxes: CustomCheckboxWidget,
                radio: CustomRadioWidget,
                number: CustomNumberWidget,
                range: CustomRangeWidget,
                date: CustomDateWidget,
                datetime: CustomDateTimeWidget,
                file: CustomFileWidget,
                boolean: CustomBooleanWidget,
            };

            const customFields = {
                array: CustomArrayField,
            };

            const customTemplates = {
                FieldTemplate: CustomFieldTemplate,
                ObjectFieldTemplate: CustomObjectFieldTemplate,
                ButtonTemplates: {
                    SubmitButton: CustomSubmitButton,
                },
            };

            // 完成状态视图
            if (!canInteract && tool.output) {
                let submittedData;
                try {
                    submittedData = typeof tool.output === "string" ? JSON.parse(tool.output) : tool.output;
                } catch (error) {
                    submittedData = tool.output;
                }
                return (
                    <div className="flex flex-col gap-2 my-1 p-3 bg-gray-50/50 border border-gray-200 rounded-xl">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                                <CheckCircle className="w-3 h-3" />
                            </div>
                            <span className="font-medium">Form Submitted</span>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm text-gray-600 pl-1">{data?.title || "表单"}</div>
                            <div className="text-sm text-gray-900 bg-white px-3 py-2.5 rounded-xl border border-gray-200">
                                <pre className="text-xs whitespace-pre-wrap break-all">{JSON.stringify(submittedData, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                );
            }

            // 交互状态视图
            return (
                <ErrorBoundary>
                    <div className="w-[70%] my-1 border border-gray-200 bg-white shadow-none rounded-xl overflow-hidden">
                        <div className="pb-2 p-3 border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <FileText className="w-3.5 h-3.5" />
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-900">{data?.title || "表单"}</h3>
                                </div>
                            </div>
                        </div>
                        <div className="p-3 space-y-3">
                            {data?.description && <div className="text-sm font-medium text-gray-900">{data.description}</div>}
                            <ErrorBoundary>
                                <Form
                                    readonly={!canInteract}
                                    schema={formSchema}
                                    formData={output}
                                    onSubmit={(formData: IChangeEvent<any>) => {
                                        try {
                                            handleSubmit(formData.formData);
                                        } catch (error) {
                                            console.error("表单提交处理错误:", error);
                                        }
                                    }}
                                    validator={validator}
                                    onError={(errors) => {
                                        console.error("表单校验错误:", errors);
                                    }}
                                    widgets={customWidgets}
                                    fields={customFields}
                                    templates={customTemplates}
                                    className="custom-form"
                                >
                                    <div className="flex justify-end pt-2">
                                        <CustomSubmitButton disabled={!canInteract} />
                                    </div>
                                </Form>
                            </ErrorBoundary>
                        </div>
                    </div>
                </ErrorBoundary>
            );
        } catch (error) {
            // 外层错误边界，捕获所有未处理的错误
            console.error("表单组件渲染错误:", error);
            const errorMessage = error instanceof Error ? error.message : "表单配置有误，请检查 schema 格式是否正确。";

            // 如果可以交互，直接将错误响应到远端
            const canInteract = tool.state === "interrupted" || tool.state === "loading";
            if (canInteract) {
                try {
                    tool.sendResumeData({
                        /** @ts-ignore */
                        type: "respond",
                        message: JSON.stringify({
                            error: "表单加载失败",
                            message: errorMessage,
                        }),
                    });
                } catch (sendError) {
                    console.error("发送错误响应失败:", sendError);
                }
            }

            return (
                <div className="w-full my-1 border border-red-200 bg-red-50 rounded-xl overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-red-600" />
                            <h3 className="text-sm font-medium text-red-900">表单加载失败</h3>
                        </div>
                        <p className="text-xs text-red-700">{errorMessage}</p>
                    </div>
                </div>
            );
        }
    },
});
