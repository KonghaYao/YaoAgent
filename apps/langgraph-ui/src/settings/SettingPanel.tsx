import React, { useState, useEffect, ReactNode } from "react";
import LoginSettings from "./LoginSettings"; // 导入新的 LoginSettings 组件
import ConsoleSettings from "./ConsoleSettings"; // 导入控制台设置组件
import ArtifactsSettings from "./ArtifactsSettings"; // 导入 artifacts 设置组件

interface SettingPanelProps {
    isOpen: boolean;
    onClose: () => void;
    tabs?: SettingTab[]; // 外部传入的 tabs，可选
}

export interface SettingTab {
    id: string;
    title: string;
    component: ReactNode;
}

const SettingPanel: React.FC<SettingPanelProps> = ({ isOpen, onClose, tabs: externalTabs }) => {
    // 内部默认的 tabs
    const defaultTabs: SettingTab[] = [
        {
            id: "server-login",
            title: "服务器",
            component: <LoginSettings />,
        },
        {
            id: "console",
            title: "控制台",
            component: <ConsoleSettings />,
        },
        {
            id: "artifacts",
            title: "Artifacts",
            component: <ArtifactsSettings />,
        },
        // 更多设置页面将在这里添加
    ];

    // 合并外部 tabs 和内部默认 tabs
    const tabs = externalTabs ? [...defaultTabs, ...externalTabs] : defaultTabs;

    // 设置默认激活的 tab 为第一个 tab
    const [activeTab, setActiveTab] = useState<string>("general");

    // 当 tabs 改变时，确保 activeTab 是有效的
    useEffect(() => {
        if (tabs.length > 0 && !tabs.find((tab) => tab.id === activeTab)) {
            setActiveTab(tabs[0].id);
        }
    }, [tabs, activeTab]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden ring-1 ring-gray-900/5 dark:ring-white/10">
                {/* 关闭按钮 */}
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={onClose}
                    aria-label="关闭设置"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="flex flex-1">
                    {/* 左侧 Tab List */}
                    <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 p-4 flex flex-col">
                        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">设置</h2>
                        <nav className="flex-1">
                            <ul>
                                {tabs.map((tab) => (
                                    <li key={tab.id}>
                                        <button
                                            id={tab.id + "-button"}
                                            className={`flex items-center w-full text-left py-2 px-3 rounded-md mb-2 text-base
                        ${activeTab === tab.id ? "bg-blue-500 text-white font-semibold shadow-sm" : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}
                        transition-colors duration-200 ease-in-out`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            {tab.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </nav>
                    </div>

                    {/* 右侧 Form Content */}
                    <div className="w-3/4 p-6 overflow-y-auto bg-gray-50 dark:bg-gray-900">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{tabs.find((tab) => tab.id === activeTab)?.title} 设置</h3>
                            {tabs.find((tab) => tab.id === activeTab)?.component}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingPanel;
