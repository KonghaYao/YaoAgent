import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { toast } from "sonner";

interface ConsoleSettingsData {}

const initialConsoleSettings: ConsoleSettingsData = {};

const ConsoleSettings: React.FC = () => {
    const [formData, setFormData] = useState<ConsoleSettingsData>(() => {
        try {
            const storedSettings = localStorage.getItem("consoleSettings");
            return storedSettings ? JSON.parse(storedSettings) : initialConsoleSettings;
        } catch (error) {
            console.error("Error reading console settings from localStorage:", error);
            return initialConsoleSettings;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("consoleSettings", JSON.stringify(formData));
        } catch (error) {
            console.error("Error writing console settings to localStorage:", error);
        }
    }, [formData]);

    return (
        <form className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">控制台说明</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                    控制台用于监控应用程序的运行状态。我们的控制台提供一个兼容 LangChain 的数据上报接口，您可以通过下面的配置来启用控制台输出。
                </p>
            </div>
            <ol>
                <li>请在 LangGraph 或者 LangChain 项目中使用以下环境变量来启用控制台输出：</li>
                <li>
                    LANGSMITH_TRACING=true
                    <br />
                    LANGSMITH_ENDPOINT= {new URL("/api/open-smith", window.location.origin).toString()}
                </li>
                <li>然后可以在主面板的 控制台 按钮中查看控制台输出。</li>
            </ol>
        </form>
    );
};

export default ConsoleSettings;
