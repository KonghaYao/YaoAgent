"use client";
import { useEffect, useRef } from "react";
import { setArtifactStore, eventCenter, ArtifactType } from "ai-artifacts";
import { useChat } from "@langgraph-js/sdk/react";
import useLocalStorage from "../hooks/useLocalStorage";
import { X } from "lucide-react";

export interface ArtifactViewerProps {
    onSendBackToAI: (data: { storeId: string; groupId: string; versionId: string; file: string; error: string }) => void;
}

export const ArtifactViewer: React.FC<ArtifactViewerProps> = ({ onSendBackToAI }) => {
    const { loading, artifacts, currentArtifactId, setShowArtifact } = useChat();

    // 从设置中读取 artifactsUrl，如果没有设置则使用默认值
    const [artifactsSettings] = useLocalStorage("artifactsUrl", { artifactsUrl: "https://langgraph-artifacts.netlify.app/" });
    const artifactsUrl = artifactsSettings.artifactsUrl || "https://langgraph-artifacts.netlify.app/";

    const artifactsRef = useRef(artifacts);

    useEffect(() => {
        if (loading) return;
        artifactsRef.current = artifacts;
        setArtifactStore({
            artifacts: { default: artifacts as ArtifactType[] },
        });
    }, [artifacts, loading]);

    useEffect(() => {
        const handleSendBackToAI = (data: any) => {
            onSendBackToAI(data);
        };
        eventCenter.on("sendBackToAI", handleSendBackToAI);
        return () => {
            eventCenter.off("sendBackToAI", handleSendBackToAI);
        };
    }, []);
    return (
        <div className="relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-full">
            {/* 头部工具栏 */}
            <div className="flex items-center justify-between p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Artifacts</h3>
                    {currentArtifactId && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            Group: {currentArtifactId[0]} • Version: {currentArtifactId[1]}
                        </span>
                    )}
                </div>
                <button
                    onClick={() => setShowArtifact(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
                    aria-label="关闭 artifacts 查看器"
                >
                    <X></X>
                </button>
            </div>

            {/* Artifacts 内容区域 */}
            <div className="relative flex-1">
                <ai-artifacts
                    src={artifactsUrl || undefined}
                    store-id="default"
                    group-id={currentArtifactId?.[0] || ""}
                    version-id={currentArtifactId?.[1] || ""}
                    className="w-full min-h-[400px]"
                ></ai-artifacts>
            </div>
        </div>
    );
};

declare module "react" {
    namespace JSX {
        interface IntrinsicElements {
            "ai-artifacts": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                "store-id"?: string;
                "group-id"?: string;
                "version-id"?: string;
            };
        }
    }
}
export {};
