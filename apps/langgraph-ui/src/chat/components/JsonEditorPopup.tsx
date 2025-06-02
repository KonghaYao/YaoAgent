import React, { useState, useEffect } from "react";

interface JsonEditorPopupProps {
    isOpen: boolean;
    initialJson: object;
    onClose: () => void;
    onSave: (jsonData: object) => void;
}

const JsonEditorPopup: React.FC<JsonEditorPopupProps> = ({ isOpen, initialJson, onClose, onSave }) => {
    const [jsonString, setJsonString] = useState("");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setJsonString(JSON.stringify(initialJson, null, 2));
        setError(null); // Reset error when initialJson changes or popup opens
    }, [initialJson, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSave = () => {
        try {
            const parsedJson = JSON.parse(jsonString);
            onSave(parsedJson);
            onClose();
        } catch (e) {
            setError("JSON 格式无效，请检查后重试。");
            console.error("Invalid JSON format:", e);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">编辑 Extra Parameters</h2>
                    <textarea
                        value={jsonString}
                        onChange={(e) => {
                            setJsonString(e.target.value);
                            setError(null); // Clear error on edit
                        }}
                        rows={15}
                        className="w-full p-3 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
                    <div className="flex justify-end gap-3 mt-4">
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
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JsonEditorPopup;
