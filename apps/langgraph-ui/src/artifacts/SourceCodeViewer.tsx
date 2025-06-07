import { useArtifacts } from "./ArtifactsContext";

export const SourceCodeViewer: React.FC = () => {
    const { currentArtifact } = useArtifacts();

    if (!currentArtifact) {
        return <div className="h-full w-full flex items-center justify-center text-gray-500">请选择一个文件</div>;
    }

    return (
        <div className="h-full w-full overflow-auto">
            <pre>{currentArtifact.code}</pre>
        </div>
    );
};
