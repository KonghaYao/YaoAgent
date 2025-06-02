import React, { useState } from "react";

interface HeaderConfig {
    key: string;
    value: string;
}

const Login: React.FC = () => {
    const [headers, setHeaders] = useState<HeaderConfig[]>([{ key: "authorization", value: "" }]);
    const [withCredentials, setWithCredentials] = useState<boolean>(localStorage.getItem("withCredentials") === "true");
    const [apiUrl, setApiUrl] = useState<string>(localStorage.getItem("apiUrl") || "");

    const addHeader = () => {
        setHeaders([...headers, { key: "", value: "" }]);
    };

    const removeHeader = (index: number) => {
        setHeaders(headers.filter((_, i) => i !== index));
    };

    const updateHeader = (index: number, field: "key" | "value", value: string) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = value;
        setHeaders(newHeaders);
    };

    const handleLogin = () => {
        const headerObject = Object.fromEntries(headers.map((k) => [k.key, k.value]));

        localStorage.setItem("code", JSON.stringify(headerObject));
        localStorage.setItem("withCredentials", JSON.stringify(withCredentials));
        localStorage.setItem("apiUrl", apiUrl);
        location.reload();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="grid md:grid-cols-2">
                    {/* 左侧品牌区域 */}
                    <div className="hidden md:block bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white">
                        <div className="h-full flex flex-col justify-between">
                            <div>
                                <h1 className="text-4xl font-bold mb-6">LangGraph UI</h1>
                                <p className="text-blue-100 text-lg leading-relaxed">专业的 LangGraph 可视化界面，让您的 AI 应用开发更加高效和直观。</p>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <span>直观的可视化界面</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                    </div>
                                    <span>高效的开发体验</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                            />
                                        </svg>
                                    </div>
                                    <span>安全可靠的配置</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右侧表单区域 */}
                    <div className="p-8 md:p-12">
                        <div className="md:hidden mb-8">
                            <h1 className="text-3xl font-bold text-gray-900">LangGraph UI</h1>
                            <p className="text-gray-600 mt-2">专业的 LangGraph 可视化界面</p>
                        </div>

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleLogin();
                            }}
                            className="space-y-6"
                        >
                            <div>
                                <label htmlFor="api-url" className="block text-sm font-medium text-gray-700 mb-2">
                                    API URL
                                </label>
                                <input
                                    type="text"
                                    id="api-url"
                                    value={apiUrl}
                                    onChange={(e) => setApiUrl(e.target.value)}
                                    placeholder="例如: http://localhost:8123"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">请求头配置</label>
                                {headers.map((header, index) => (
                                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <input
                                                    type="text"
                                                    id={`header-key-${index}`}
                                                    value={header.key}
                                                    onChange={(e) => updateHeader(index, "key", e.target.value)}
                                                    placeholder="例如: authorization"
                                                    required
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                />
                                            </div>
                                        </div>
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeHeader(index)}
                                                className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center space-x-1 transition-colors"
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

                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="with-credentials"
                                    checked={withCredentials}
                                    onChange={(e) => setWithCredentials(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="with-credentials" className="text-sm text-gray-700">
                                    启用 withCredentials（跨域请求时发送 Cookie）
                                </label>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={addHeader}
                                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    <span>添加请求头</span>
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center space-x-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span>保存配置</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
