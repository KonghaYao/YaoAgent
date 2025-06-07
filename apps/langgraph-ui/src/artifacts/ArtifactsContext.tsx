import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { useChat } from "../chat/context/ChatContext";
import { Message } from "@langgraph-js/sdk";

interface Artifact {
    id: string;
    code: string;
    filename: string;
    filetype: string;
    version: number;
}

interface ArtifactsContextType {
    artifacts: Artifact[];
    currentArtifact: Artifact | null;
    setCurrentArtifactById: (id: string) => void;
    getArtifactVersions: (filename: string) => Artifact[];
    showArtifact: boolean;
    setShowArtifact: (show: boolean) => void;
}

const ArtifactsContext = createContext<ArtifactsContextType>({
    artifacts: [],
    currentArtifact: null,
    setCurrentArtifactById: () => {},
    getArtifactVersions: () => [],
    showArtifact: false,
    setShowArtifact: () => {},
});

export const useArtifacts = () => useContext(ArtifactsContext);

interface ArtifactsProviderProps {
    children: ReactNode;
}

export const ArtifactsProvider: React.FC<ArtifactsProviderProps> = ({ children }) => {
    const [artifacts, setArtifacts] = useState<Artifact[]>([]);
    const [showArtifact, setShowArtifact] = useState(false);
    const { renderMessages } = useChat();
    const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);

    // 获取指定文件名的所有版本
    const getArtifactVersions = (filename: string) => {
        return artifacts.filter((artifact) => artifact.filename === filename).sort((a, b) => a.version - b.version);
    };

    useEffect(() => {
        if (!renderMessages) return;

        const createArtifacts = renderMessages.filter((message) => message.type === "tool").filter((message) => message.name === "create_artifacts");

        // 创建文件名到最新版本的映射
        const filenameToLatestVersion = new Map<string, number>();

        // 处理每个 artifact，分配版本号
        const processedArtifacts = createArtifacts.map((message) => {
            const content = JSON.parse(message.tool_input as string);
            const filename = content.filename;

            // 获取当前文件名的最新版本号
            const currentVersion = filenameToLatestVersion.get(filename) || 0;
            const newVersion = currentVersion + 1;

            // 更新最新版本号
            filenameToLatestVersion.set(filename, newVersion);

            return {
                id: message.id!,
                code: content.code,
                filename: filename,
                version: newVersion,
                filetype: content.filetype,
            };
        });

        setArtifacts(processedArtifacts);
    }, [renderMessages]);

    const setCurrentArtifactById = (id: string) => {
        setShowArtifact(true);
        setCurrentArtifact(artifacts.find((artifact) => artifact.id === id) || null);
    };

    return (
        <ArtifactsContext.Provider
            value={{
                artifacts,
                currentArtifact,
                setCurrentArtifactById,
                getArtifactVersions,
                showArtifact,
                setShowArtifact,
            }}
        >
            {children}
        </ArtifactsContext.Provider>
    );
};
