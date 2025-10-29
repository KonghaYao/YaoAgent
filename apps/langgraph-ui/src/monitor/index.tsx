import React, { createContext, useContext, useState, ReactNode } from "react";

// Context 类型定义
interface MonitorContextValue {
    isOpen: boolean;
    url: string;
    openMonitor: (url: string) => void;
    closeModal: () => void;
    openMonitorWithChat: (thread_id: string, trace_id?: string) => void;
}

// 创建 Context
const MonitorContext = createContext<MonitorContextValue | undefined>(undefined);

// Modal Provider 组件
export const MonitorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [url, setUrl] = useState("");

    const openModal = (newUrl: string) => {
        setUrl(newUrl);

        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
        setUrl("");
    };

    const openMonitorWithChat = (thread_id: string, trace_id?: string) => {
        const url = new URL("/api/open-smith/ui/index.html", window.location.origin);
        const qs = new URLSearchParams();
        qs.set("thread_id", thread_id);
        if (trace_id) {
            qs.set("trace_id", trace_id);
        }
        url.hash = "/?" + qs.toString();
        openModal(url.toString());
    };

    return <MonitorContext.Provider value={{ isOpen, url, openMonitor: openModal, closeModal, openMonitorWithChat }}>{children}</MonitorContext.Provider>;
};

// Hook 用于在组件中使用 modal
export const useMonitor = () => {
    const context = useContext(MonitorContext);
    if (context === undefined) {
        throw new Error("useModal must be used within a ModalProvider");
    }
    return context;
};

// Modal 组件
export const Monitor: React.FC = () => {
    const { isOpen, url, closeModal } = useMonitor();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] h-full flex flex-col border border-gray-200 relative">
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl leading-none absolute top-2 right-2 z-50 cursor-pointer">
                    ×
                </button>
                <div className="flex-1 p-4 min-h-0">{url && <iframe src={url} className="w-full h-full border rounded" title="Monitor" sandbox="allow-scripts allow-same-origin" />}</div>
            </div>
        </div>
    );
};
