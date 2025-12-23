import React from "react";
import SettingFormBase from "./SettingFormBase";

interface ArtifactsSettingsData {
    artifactsUrl: string;
}

const initialArtifactsSettings: ArtifactsSettingsData = {
    artifactsUrl: "https://langgraph-artifacts.netlify.app/",
};

const ArtifactsSettings: React.FC = () => {
    return (
        <SettingFormBase settingKey="artifactsUrl" initialData={initialArtifactsSettings}>
            {(formData, handleChange) => (
                <form className="space-y-6">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Artifacts 设置</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                            配置 artifacts 查看器的 URL。这个 URL 指向用于显示 artifacts 的 Web 组件。
                        </p>
                    </div>

                    <div>
                        <label htmlFor="artifactsUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Artifacts URL
                        </label>
                        <input
                            type="url"
                            id="artifactsUrl"
                            name="artifactsUrl"
                            value={formData.artifactsUrl}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                            placeholder="https://langgraph-artifacts.netlify.app/"
                        />
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            输入有效的 URL 地址，用于加载 artifacts 查看器组件。
                        </p>
                    </div>
                </form>
            )}
        </SettingFormBase>
    );
};

export default ArtifactsSettings;
