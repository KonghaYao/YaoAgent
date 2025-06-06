import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useGlobal } from "../context/GlobalContext";

interface MCPConfigDialogProps {
    onClose: () => void;
}

export function MCPConfigDialog({ onClose }: MCPConfigDialogProps) {
    const { state, updateMCPConfig } = useGlobal();

    // 确保初始状态是数组，并且每个配置都有 headers 对象
    const [configs, setConfigs] = useState<typeof state.mcpConfig>(() => {
        if (state.mcpConfig && state.mcpConfig.length > 0) {
            // 确保每个配置都有 headers 对象
            return state.mcpConfig.map((config) => ({
                ...config,
                headers: config.headers || {},
            }));
        }
        return [{ url: "", headers: {}, transport: "http", name: "配置 1" }];
    });

    const [newHeaderKey, setNewHeaderKey] = useState("");
    const [newHeaderValue, setNewHeaderValue] = useState("");
    const [selectedConfigIndex, setSelectedConfigIndex] = useState(0);
    const [error, setError] = useState<string | null>(null);

    // 当全局状态变化时更新本地状态，确保 headers 存在
    useEffect(() => {
        if (state.mcpConfig && state.mcpConfig.length > 0) {
            // 深拷贝配置数组，确保每个配置都有 headers
            const updatedConfigs = state.mcpConfig.map((config) => ({
                ...config,
                headers: config.headers || {},
            }));
            console.log("从全局状态更新配置:", updatedConfigs);
            setConfigs(updatedConfigs);
        }
    }, [state.mcpConfig]);

    const validateConfig = (config: (typeof configs)[0]): string | null => {
        if (!config.url) {
            return "URL 不能为空";
        }
        try {
            new URL(config.url);
        } catch {
            return "URL 格式不正确";
        }
        return null;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // 验证所有配置
        for (let i = 0; i < configs.length; i++) {
            const error = validateConfig(configs[i]);
            if (error) {
                setError(`配置 ${i + 1}: ${error}`);
                setSelectedConfigIndex(i);
                return;
            }
        }

        // 过滤掉空配置
        const validConfigs = configs.filter((config) => config.url.trim() !== "");

        // 确保保存的数据格式正确
        const formattedConfigs = validConfigs.map((config) => ({
            url: config.url,
            headers: config.headers || {}, // 修改为不使用深拷贝 + 空值回退
            name: config.name || `配置 ${configs.indexOf(config) + 1}`,
            transport: config.transport || "http",
        }));

        // 更新全局状态
        updateMCPConfig(formattedConfigs);

        // 打印保存的数据，用于调试
        console.log("保存的配置:", formattedConfigs);

        onClose();
    };

    const addConfig = () => {
        setConfigs((prev) => [
            ...prev,
            {
                url: "",
                headers: {},
                transport: "http",
                name: `配置 ${prev.length + 1}`,
            },
        ]);
        setSelectedConfigIndex(configs.length);
        setError(null);
    };

    const removeConfig = (index: number) => {
        setConfigs((prev) => prev.filter((_, i) => i !== index));
        // 如果删除的是当前选中的配置，则选中前一个配置
        if (index === selectedConfigIndex) {
            setSelectedConfigIndex(Math.max(0, index - 1));
        } else if (index < selectedConfigIndex) {
            // 如果删除的配置在当前选中配置之前，需要调整选中索引
            setSelectedConfigIndex(selectedConfigIndex - 1);
        }
        setError(null);
    };

    const updateConfig = (index: number, updates: Partial<(typeof configs)[0]>) => {
        setConfigs((prev) =>
            prev.map((config, i) => {
                if (i === index) {
                    // 如果更新包含 headers，确保保留现有的 headers
                    if (updates.headers) {
                        return {
                            ...config,
                            ...updates,
                            headers: {
                                ...config.headers,
                                ...updates.headers,
                            },
                        };
                    }
                    return { ...config, ...updates };
                }
                return config;
            })
        );
        setError(null);
    };

    const addHeader = (configIndex: number) => {
        if (newHeaderKey && newHeaderValue) {
            // 检查 key 是否已存在
            if (configs[configIndex].headers && configs[configIndex].headers[newHeaderKey]) {
                setError(`配置 ${configIndex + 1}: 请求头 "${newHeaderKey}" 已存在`);
                return;
            }

            setConfigs((prev) =>
                prev.map((config, i) =>
                    i === configIndex
                        ? {
                              ...config,
                              headers: {
                                  ...(config.headers || {}),
                                  [newHeaderKey]: newHeaderValue,
                              },
                          }
                        : config
                )
            );
            setNewHeaderKey("");
            setNewHeaderValue("");
            setError(null);

            // 打印添加后的 headers，用于调试
            console.log(`添加请求头后的配置 ${configIndex}:`, configs[configIndex]);
        }
    };

    const removeHeader = (configIndex: number, key: string) => {
        setConfigs((prev) =>
            prev.map((config, i) => {
                if (i === configIndex && config.headers) {
                    const newHeaders = { ...config.headers };
                    delete newHeaders[key];
                    return { ...config, headers: newHeaders };
                }
                return config;
            })
        );
        setError(null);
    };

    // 调试输出当前选中配置的 headers
    useEffect(() => {
        if (configs[selectedConfigIndex]) {
            console.log(`当前选中配置 ${selectedConfigIndex} 的 headers:`, configs[selectedConfigIndex].headers);
        }
    }, [configs, selectedConfigIndex]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                <form onSubmit={handleSubmit}>
                    {/* 头部 */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium text-gray-900">MCP 配置</h2>
                            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors duration-200">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* 配置列表 */}
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex space-x-2">
                                {configs.map((config, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setSelectedConfigIndex(index)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium ${
                                            selectedConfigIndex === index ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                    >
                                        {config.name || `配置 ${index + 1}`}
                                    </button>
                                ))}
                            </div>
                            <button type="button" onClick={addConfig} className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                                <Plus className="w-4 h-4 inline mr-1" />
                                添加配置
                            </button>
                        </div>

                        {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">{error}</div>}

                        {configs.map((config, index) => (
                            <div key={index} className={`space-y-4 ${selectedConfigIndex === index ? "" : "hidden"}`}>
                                <div className="flex justify-between items-center">
                                    <h3 className="text-sm font-medium text-gray-700">{config.name || `配置 ${index + 1}`}</h3>
                                    <button type="button" onClick={() => removeConfig(index)} className="text-red-500 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">名称</label>
                                    <input
                                        type="text"
                                        value={config.name || ""}
                                        onChange={(e) => updateConfig(index, { name: e.target.value })}
                                        className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                        placeholder={`配置 ${index + 1}`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                                    <input
                                        type="text"
                                        value={config.url}
                                        onChange={(e) => updateConfig(index, { url: e.target.value })}
                                        className="block w-full rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm transition-colors duration-200"
                                        placeholder="https://api.example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">传输方式</label>
                                    <div className="flex items-center space-x-4 mt-1">
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="http"
                                                checked={config.transport === "http"}
                                                onChange={() => updateConfig(index, { transport: "http" })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">HTTP （Streamable）</span>
                                        </label>
                                        <label className="inline-flex items-center">
                                            <input
                                                type="radio"
                                                value="sse"
                                                checked={config.transport === "sse"}
                                                onChange={() => updateConfig(index, { transport: "sse" })}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">SSE (Server-Sent Events)</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        请求头
                                        {Object.keys(config.headers || {}).length > 0 && <span className="ml-2 text-xs text-gray-500">({Object.keys(config.headers || {}).length} 个)</span>}
                                    </label>
                                    <div className="space-y-2">
                                        {config.headers && Object.entries(config.headers).length > 0 ? (
                                            Object.entries(config.headers).map(([key, value]) => (
                                                <div key={key} className="flex items-center space-x-2">
                                                    <input type="text" value={key} disabled className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
                                                    <input type="text" value={value} disabled className="flex-1 rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm" />
                                                    <button type="button" onClick={() => removeHeader(index, key)} className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-2 text-sm text-gray-500">暂无请求头</div>
                                        )}

                                        <div className="flex items-center space-x-2">
                                            <input
                                                type="text"
                                                value={newHeaderKey}
                                                onChange={(e) => setNewHeaderKey(e.target.value)}
                                                placeholder="Key"
                                                className="flex-1 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={newHeaderValue}
                                                onChange={(e) => setNewHeaderValue(e.target.value)}
                                                placeholder="Value"
                                                className="flex-1 rounded-md border border-gray-300 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 text-sm"
                                            />
                                            <button type="button" onClick={() => addHeader(index)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors duration-200">
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* 底部按钮 */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                取消
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
