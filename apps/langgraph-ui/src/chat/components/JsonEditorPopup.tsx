import React, { useState, useEffect } from "react";

interface JsonPreset {
    name: string;
    data: object;
}

interface JsonEditorPopupProps {
    isOpen: boolean;
    initialJson: object;
    onClose: () => void;
    onSave: (jsonData: object) => void;
}

const LOCAL_STORAGE_KEY = "json-editor-presets";
const ACTIVE_TAB_STORAGE_KEY = "json-editor-active-tab";

const JsonEditorPopup: React.FC<JsonEditorPopupProps> = ({ isOpen, initialJson, onClose, onSave }) => {
    const [presets, setPresets] = useState<JsonPreset[]>([]);
    const [activeTab, setActiveTab] = useState(0);
    const [jsonString, setJsonString] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [editingTab, setEditingTab] = useState<number | null>(null);
    const [editingName, setEditingName] = useState("");

    useEffect(() => {
        if (isOpen) {
            let storedData: JsonPreset[] = [];
            try {
                const item = localStorage.getItem(LOCAL_STORAGE_KEY);
                storedData = item ? JSON.parse(item) : [];
            } catch (e) {
                console.error("Failed to parse presets from localStorage", e);
                storedData = [];
            }

            if (storedData.length === 0) {
                storedData = [{ name: "Default", data: initialJson }];
            }
            setPresets(storedData);

            let activeTabIndex = 0;
            try {
                const storedIndex = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
                if (storedIndex) {
                    const parsedIndex = parseInt(storedIndex, 10);
                    if (parsedIndex >= 0 && parsedIndex < storedData.length) {
                        activeTabIndex = parsedIndex;
                    }
                }
            } catch (e) {
                console.error("Failed to parse active tab from localStorage", e);
            }
            setActiveTab(activeTabIndex);
            setError(null);
        }
    }, [isOpen, initialJson]);

    useEffect(() => {
        if (isOpen && presets.length > 0 && presets[activeTab]) {
            setJsonString(JSON.stringify(presets[activeTab].data, null, 2));
            setError(null);
        }
    }, [activeTab, presets, isOpen]);

    useEffect(() => {
        if (isOpen) {
            localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab.toString());
        }
    }, [activeTab, isOpen]);

    if (!isOpen) {
        return null;
    }

    const updatePresetsInStorage = (newPresets: JsonPreset[]) => {
        setPresets(newPresets);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPresets));
    };

    const handleAddTab = () => {
        const newPreset: JsonPreset = { name: `Preset ${presets.length + 1}`, data: {} };
        const newPresets = [...presets, newPreset];
        updatePresetsInStorage(newPresets);
        setActiveTab(newPresets.length - 1);
    };

    const handleDeleteTab = (indexToDelete: number) => {
        let newPresets = presets.filter((_, index) => index !== indexToDelete);
        if (newPresets.length === 0) {
            newPresets = [{ name: "Default", data: initialJson }];
        }
        updatePresetsInStorage(newPresets);
        if (activeTab >= indexToDelete && activeTab > 0) {
            setActiveTab(activeTab - 1);
        } else if (activeTab >= newPresets.length) {
            setActiveTab(newPresets.length - 1);
        }
    };

    const handleSave = () => {
        try {
            const parsedJson = JSON.parse(jsonString);
            const updatedPresets = presets.map((preset, index) => {
                if (index === activeTab) {
                    return { ...preset, data: parsedJson };
                }
                return preset;
            });
            updatePresetsInStorage(updatedPresets);
            onSave(parsedJson);
            onClose();
        } catch (e) {
            setError("JSON 格式无效，请检查后重试。");
            console.error("Invalid JSON format:", e);
        }
    };

    const handleRename = (index: number) => {
        if (editingName.trim() !== "") {
            const newPresets = presets.map((p, i) => (i === index ? { ...p, name: editingName.trim() } : p));
            updatePresetsInStorage(newPresets);
            setEditingTab(null);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 flex flex-col" style={{ height: "80vh" }}>
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">编辑 Extra Parameters</h2>
                </div>
                <div className="flex-grow p-6 overflow-y-auto">
                    <div className="flex items-center border-b border-gray-200 mb-4">
                        {presets.map((preset, index) => (
                            <div
                                key={index}
                                className={`flex items-center px-4 py-2 border-b-2 cursor-pointer text-sm font-medium ${
                                    activeTab === index ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                }`}
                                onDoubleClick={() => {
                                    setEditingTab(index);
                                    setEditingName(preset.name);
                                }}
                                onClick={() => setActiveTab(index)}
                            >
                                {editingTab === index ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => handleRename(index)}
                                        onKeyDown={(e) => e.key === "Enter" && handleRename(index)}
                                        className="text-sm p-0 border-none focus:ring-0 bg-transparent"
                                        autoFocus
                                    />
                                ) : (
                                    <span>{preset.name}</span>
                                )}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteTab(index);
                                    }}
                                    className="ml-2 text-gray-400 hover:text-gray-600 w-4 h-4 flex items-center justify-center"
                                >
                                    &times;
                                </button>
                            </div>
                        ))}
                        <button onClick={handleAddTab} className="ml-2 px-3 py-1 text-sm text-gray-500 hover:text-gray-700">
                            +
                        </button>
                    </div>

                    <textarea
                        value={jsonString}
                        onChange={(e) => {
                            setJsonString(e.target.value);
                            setError(null); // Clear error on edit
                        }}
                        className="w-full h-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                </div>
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        取消
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        保存并使用
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JsonEditorPopup;
