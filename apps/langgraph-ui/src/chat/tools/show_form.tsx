import { createUITool, ToolManager } from "@langgraph-js/sdk";
import Form, { IChangeEvent } from "@rjsf/core";
import ErrorBoundary from "../components/ErrorBoundary";
import { FileText, Eye, EyeOff, ChevronDown, X, Plus, Minus } from "lucide-react";
import { z } from "zod";
import validator from "@rjsf/validator-ajv8";
import { useState } from "react";

// 自定义文本输入组件
const CustomTextWidget = (props: any) => {
    const hasMinLength = props.options?.minLength;
    const hasMaxLength = props.options?.maxLength;
    const currentLength = props.value?.length || 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
                disabled={props.disabled}
                maxLength={hasMaxLength ? props.options.maxLength : undefined}
            />
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

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <input
                    type={showPassword ? "text" : "password"}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={props.value || ""}
                    onChange={(e) => props.onChange(e.target.value)}
                    placeholder={props.placeholder}
                    disabled={props.disabled}
                />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
            </div>
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义文本区域组件
const CustomTextareaWidget = (props: any) => {
    const hasMinLength = props.options?.minLength;
    const hasMaxLength = props.options?.maxLength;
    const currentLength = props.value?.length || 0;

    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical"
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                placeholder={props.placeholder}
                disabled={props.disabled}
                rows={props.options?.rows || 4}
                maxLength={hasMaxLength ? props.options.maxLength : undefined}
            />
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
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="relative">
                <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors appearance-none"
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
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义多选框组件
const CustomCheckboxWidget = (props: any) => {
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="space-y-2">
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
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义单选按钮组件
const CustomRadioWidget = (props: any) => {
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="space-y-2">
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
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义数字输入组件
const CustomNumberWidget = (props: any) => {
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={props.value || ""}
                onChange={(e) => props.onChange(Number(e.target.value))}
                placeholder={props.placeholder}
                disabled={props.disabled}
                min={props.options?.min}
                max={props.options?.max}
                step={props.options?.step}
            />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义滑块组件
const CustomRangeWidget = (props: any) => {
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="px-2">
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
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义日期选择器组件
const CustomDateWidget = (props: any) => {
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                disabled={props.disabled}
            />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义日期时间选择器组件
const CustomDateTimeWidget = (props: any) => {
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                value={props.value || ""}
                onChange={(e) => props.onChange(e.target.value)}
                disabled={props.disabled}
            />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义布尔值组件
const CustomBooleanWidget = (props: any) => {
    return (
        <div className="mb-4">
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
            {props.description && <p className="text-xs text-gray-500 mt-1 ml-6">{props.description}</p>}
        </div>
    );
};

// 自定义文件上传组件
const CustomFileWidget = (props: any) => {
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <input
                type="file"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors file:mr-3 file:py-1 file:px-3 file:border-0 file:bg-blue-50 file:text-blue-700 file:rounded file:font-medium"
                onChange={handleFileChange}
                disabled={props.disabled}
                multiple={props.multiple}
                accept={props.accept}
            />
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义数组字段组件
const CustomArrayField = (props: any) => {
    return (
        <div className="mb-4">
            {props.label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {props.label}
                    {props.required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}
            <div className="space-y-2">
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
            {props.description && <p className="text-xs text-gray-500 mt-1">{props.description}</p>}
        </div>
    );
};

// 自定义字段模板
const CustomFieldTemplate = (props: any) => {
    return <div className={`${props.className} mb-4`}>{props.children}</div>;
};

// 自定义对象字段模板
const CustomObjectFieldTemplate = (props: any) => {
    return (
        <div className="mb-4">
            {props.title && <h3 className="text-sm font-medium text-gray-700 mb-2">{props.title}</h3>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-4 border-l-2 border-gray-200">
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
        <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors disabled:cursor-not-allowed"
            disabled={props.disabled}
        >
            {props.submitText || "提交"}
        </button>
    );
};

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
        return (
            <div className="p-4 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center gap-1.5 text-gray-700 mb-3 font-bold">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <span>AI 表单</span>
                </div>
                <ErrorBoundary>
                    <Form
                        readonly={tool.state === "done"}
                        schema={formSchema || {}}
                        formData={output}
                        onSubmit={(data: IChangeEvent<any>) => handleSubmit(data.formData)}
                        validator={validator}
                        onError={(errors) => {
                            console.error("表单校验错误:", errors);
                            alert("表单填写有误，请检查后再提交。");
                        }}
                        widgets={customWidgets}
                        fields={customFields}
                        templates={customTemplates}
                        className="custom-form"
                    >
                        <div className="flex gap-2 mt-4">
                            <CustomSubmitButton />
                        </div>
                    </Form>
                </ErrorBoundary>
            </div>
        );
    },
});
