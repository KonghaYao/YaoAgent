import React, { useState, useEffect, useCallback, ChangeEvent } from "react";
import { toast } from "sonner";

interface HeaderConfig {
    key: string;
    value: string;
}

interface LoginSettingsData {
    headers: HeaderConfig[];
    withCredentials: boolean;
    apiUrl: string;
    defaultAgent: string;
}

const initialLoginSettings: LoginSettingsData = {
    headers: [{ key: "authorization", value: "" }],
    withCredentials: false,
    apiUrl: "/api/langgraph",
    defaultAgent: "agent",
};

const apiUrlShortcuts = ["/api/langgraph", "http://localhost:8123", "http://localhost:3000", "http://localhost:8000", "http://localhost:5000"];

const LoginSettings: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [formData, setFormData] = useState<LoginSettingsData>(() => {
        try {
            const storedHeaders = localStorage.getItem("code");
            const storedWithCredentials = localStorage.getItem("withCredentials");
            const storedApiUrl = localStorage.getItem("apiUrl");
            const storedDefaultAgent = localStorage.getItem("defaultAgent");

            let headers = initialLoginSettings.headers;
            if (storedHeaders) {
                const parsedHeaders = JSON.parse(storedHeaders);
                // 检查是否是对象格式（旧格式），如果是则转换为数组格式
                if (typeof parsedHeaders === "object" && !Array.isArray(parsedHeaders)) {
                    headers = Object.entries(parsedHeaders).map(([key, value]) => ({ key, value: value as string }));
                } else if (Array.isArray(parsedHeaders)) {
                    headers = parsedHeaders;
                }
            }

            return {
                headers,
                withCredentials: storedWithCredentials ? JSON.parse(storedWithCredentials) : initialLoginSettings.withCredentials,
                apiUrl: storedApiUrl || initialLoginSettings.apiUrl,
                defaultAgent: storedDefaultAgent || initialLoginSettings.defaultAgent,
            };
        } catch (error) {
            console.error("Error reading login settings from localStorage:", error);
            return initialLoginSettings;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem("code", JSON.stringify(formData.headers));
            localStorage.setItem("withCredentials", JSON.stringify(formData.withCredentials));
            localStorage.setItem("apiUrl", formData.apiUrl);
            localStorage.setItem("defaultAgent", formData.defaultAgent);
        } catch (error) {
            console.error("Error writing login settings to localStorage:", error);
        }
    }, [formData]);

    // 点击外部关闭下拉菜单
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (isDropdownOpen && !target.closest(".api-url-dropdown")) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownOpen]);

    const addHeader = useCallback(() => {
        setFormData((prevData) => ({
            ...prevData,
            headers: [...prevData.headers, { key: "", value: "" }],
        }));
    }, []);

    const removeHeader = useCallback((index: number) => {
        setFormData((prevData) => ({
            ...prevData,
            headers: prevData.headers.filter((_, i) => i !== index),
        }));
    }, []);

    const updateHeader = useCallback((index: number, field: "key" | "value", value: string) => {
        setFormData((prevData) => {
            const newHeaders = [...prevData.headers];
            newHeaders[index][field] = value;
            return { ...prevData, headers: newHeaders };
        });
    }, []);

    const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: type === "checkbox" ? checked : value,
        }));
    }, []);

    const handleSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    }, []);

    const handleApiUrlShortcutSelect = useCallback((url: string) => {
        setFormData((prevData) => ({
            ...prevData,
            apiUrl: url,
        }));
        setIsDropdownOpen(false);
    }, []);

    const handleSave = () => {
        // 保存逻辑已经通过 useEffect 处理了，这里可以添加其他保存后的操作，例如提示用户保存成功
        toast.success("配置已保存！重启程序");
        setTimeout(() => {
            window.location.reload();
        }, 500);
    };

    return (
        <form className="space-y-6">
            <div>
                <label htmlFor="default-agent" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    默认 Agent 名称
                </label>
                <input
                    type="text"
                    id="defaultAgent"
                    name="defaultAgent"
                    value={formData.defaultAgent}
                    onChange={handleInputChange}
                    placeholder="例如: assistant"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
            </div>

            <div>
                <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API URL
                </label>
                <div className="relative api-url-dropdown">
                    <div className="flex">
                        <input
                            type="text"
                            id="apiUrl"
                            name="apiUrl"
                            value={formData.apiUrl}
                            onChange={handleInputChange}
                            placeholder="例如: http://localhost:8123"
                            className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <button
                            type="button"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="px-3 py-3 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                    {isDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg">
                            {apiUrlShortcuts.map((url, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => handleApiUrlShortcutSelect(url)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors first:rounded-t-lg last:rounded-b-lg text-gray-900 dark:text-white"
                                >
                                    {url}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">请求头配置</label>
                <div className="space-y-3">
                    {formData.headers.map((header, index) => (
                        <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 shadow-sm">
                            <div className="grid grid-cols-2 gap-4 mb-3">
                                <div>
                                    <input
                                        type="text"
                                        id={`header-key-${index}`}
                                        value={header.key}
                                        onChange={(e) => updateHeader(index, "key", e.target.value)}
                                        placeholder="例如: authorization"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        id={`header-value-${index}`}
                                        value={header.value}
                                        onChange={(e) => updateHeader(index, "value", e.target.value)}
                                        placeholder="例如: Bearer token；无则填 1"
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                            {index > 0 && (
                                <button
                                    type="button"
                                    onClick={() => removeHeader(index)}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 text-sm font-medium flex items-center space-x-1 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                    <span>删除此请求头</span>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    id="withCredentials"
                    name="withCredentials"
                    checked={formData.withCredentials}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="withCredentials" className="text-sm text-gray-700 dark:text-gray-300">
                    启用 withCredentials（跨域请求时发送 Cookie）
                </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                    type="button"
                    onClick={addHeader}
                    className="flex-1 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>添加请求头</span>
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>保存配置</span>
                </button>
            </div>
        </form>
    );
};

export default LoginSettings;
