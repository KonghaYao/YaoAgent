import { useEffect, useRef, useState } from "react";
import { wrap, windowEndpoint } from "comlink";
import { useArtifacts } from "./ArtifactsContext";
import { SourceCodeViewer } from "./SourceCodeViewer";
import { ChevronDown } from "lucide-react";

type ViewMode = "preview" | "source";

export const ArtifactViewer: React.FC = () => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { currentArtifact, getArtifactVersions, setCurrentArtifactById, artifacts } = useArtifacts();
    const [iframeKey, setIframeKey] = useState(0);
    const [viewMode, setViewMode] = useState<ViewMode>("preview");
    const [isFileSelectOpen, setIsFileSelectOpen] = useState(false);

    const getIframeAPI = async (iframe: HTMLIFrameElement) => {
        const iframeApi = wrap(windowEndpoint(iframe.contentWindow!));

        // 5 秒内，每 50 ms 检测一次 init 函数
        const index = await Promise.race(
            Array(100)
                .fill(0)
                .map((_, index) => {
                    return new Promise((resolve) => {
                        setTimeout(async () => {
                            /* @ts-ignore */
                            if (await iframeApi.init()) {
                                resolve(index);
                            }
                        }, 100 * index);
                    });
                })
        );

        return iframeApi;
    };

    const runCode = async () => {
        console.log(iframeKey);
        if (!iframeRef.current) return;

        setIsLoading(true);
        try {
            const iframeApi: any = await getIframeAPI(iframeRef.current);
            await iframeApi.run(currentArtifact?.code, currentArtifact?.filename, currentArtifact?.filetype);
        } catch (error) {
            console.error("Failed to run code:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const refresh = () => {
        setIframeKey((prev) => prev + 1);
    };

    // useEffect(() => {
    //     if (currentArtifact && iframeRef.current) {
    //         setIframeKey((prev) => prev + 1);
    //     }
    // }, [currentArtifact?.id]);

    useEffect(() => {
        if (iframeRef.current) {
            runCode();
        }
    }, [iframeKey]);

    if (!currentArtifact) {
        return <div className="h-full w-full flex items-center justify-center text-gray-500">请选择一个文件</div>;
    }

    const versions = getArtifactVersions(currentArtifact.filename);

    // 获取所有唯一的文件名
    const uniqueFilenames = Array.from(new Set(artifacts.map((a) => a.filename)));

    return (
        <div className="h-full w-full flex flex-col">
            <div className="flex items-center justify-between p-2 border-b">
                <div className="flex items-center space-x-4">
                    <div className="flex space-x-2">
                        <button
                            className={`px-3 py-1 rounded ${viewMode === "preview" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`}
                            onClick={() => {
                                setViewMode("preview");
                                refresh();
                            }}
                        >
                            预览
                        </button>
                        <button className={`px-3 py-1 rounded ${viewMode === "source" ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"}`} onClick={() => setViewMode("source")}>
                            源代码
                        </button>
                    </div>
                    <div className="relative">
                        <button className="flex items-center space-x-2 px-3 py-1 bg-gray-100 rounded hover:bg-gray-200" onClick={() => setIsFileSelectOpen(!isFileSelectOpen)}>
                            <span>{currentArtifact.filename}</span>
                            <ChevronDown className="w-4 h-4" />
                        </button>
                        {isFileSelectOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-10">
                                {uniqueFilenames.map((filename) => {
                                    const fileVersions = getArtifactVersions(filename);
                                    const latestVersion = fileVersions[fileVersions.length - 1];
                                    return (
                                        <button
                                            key={filename}
                                            className="w-full text-left px-3 py-2 hover:bg-gray-100"
                                            onClick={() => {
                                                setCurrentArtifactById(latestVersion.id);
                                                setIsFileSelectOpen(false);
                                            }}
                                        >
                                            {filename}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">版本:</span>
                        <div className="flex space-x-1">
                            {versions.map((version) => (
                                <button
                                    key={version.id}
                                    className={`px-2 py-1 text-sm rounded ${version.id === currentArtifact.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                    onClick={() => setCurrentArtifactById(version.id)}
                                >
                                    v{version.version}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                {viewMode === "preview" && (
                    <div className="flex space-x-2">
                        <button disabled={isLoading} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">
                            {isLoading ? "Running..." : "Run"}
                        </button>
                        <button onClick={refresh} disabled={isLoading} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50">
                            Refresh
                        </button>
                    </div>
                )}
            </div>
            <div className="flex-1 overflow-auto">
                {viewMode === "preview" ? (
                    <iframe key={iframeKey} ref={iframeRef} src="https://langgraph-artifacts.netlify.app/index.html" className="w-full h-full border border-gray-300" />
                ) : (
                    <SourceCodeViewer />
                )}
            </div>
        </div>
    );
};
