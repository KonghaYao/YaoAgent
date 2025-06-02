import React, { useState } from "react";
import JsonToMessage from "./JsonToMessage";
import { FileJson } from "lucide-react";

export const JsonToMessageButton: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center gap-1.5"
            >
                <FileJson className="w-4 h-4" />
                JSON 消息
            </button>
            <JsonToMessage isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};
