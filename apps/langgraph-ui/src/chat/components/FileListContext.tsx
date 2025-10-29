import React, { createContext, useContext, useState, useCallback } from "react";
import { TmpFilesClient } from "../FileUpload";
import type { SupportedFileType } from "./FileList";

interface UploadedFile {
    file: File;
    url: string;
    type: SupportedFileType;
}

interface MediaUrl {
    type: "image_url" | "video_url" | "audio_url" | "file_url";
    image_url?: { url: string };
    video_url?: { url: string };
    audio_url?: { url: string };
    file_url?: { url: string };
    fileType: SupportedFileType;
}

interface FileListContextType {
    uploadedFiles: UploadedFile[];
    mediaUrls: MediaUrl[];
    isFileTextMode: {
        image: boolean;
        video: boolean;
        audio: boolean;
        other: boolean;
    };
    setIsFileTextMode: React.Dispatch<
        React.SetStateAction<{
            image: boolean;
            video: boolean;
            audio: boolean;
            other: boolean;
        }>
    >;
    handleFileUploaded: (url: string, fileType: SupportedFileType) => void;
    handleFileRemoved: (url: string, fileType: SupportedFileType) => void;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    removeFile: (index: number) => void;
    MAX_FILES: number;
}

const FileListContext = createContext<FileListContextType | undefined>(undefined);

export const useFileList = () => {
    const context = useContext(FileListContext);
    if (!context) {
        throw new Error("useFileList must be used within a FileListProvider");
    }
    return context;
};

interface FileListProviderProps {
    children: React.ReactNode;
}

export const FileListProvider: React.FC<FileListProviderProps> = ({ children }) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [mediaUrls, setMediaUrls] = useState<MediaUrl[]>([]);
    const [isFileTextMode, setIsFileTextMode] = useState({
        image: false,
        video: false,
        audio: false,
        other: true,
    });
    const MAX_FILES = 3;
    const client = new TmpFilesClient();

    const handleFileUploaded = useCallback((url: string, fileType: SupportedFileType) => {
        // 上传时始终保存原始文件信息，在发送时根据文本模式决定格式
        if (fileType === "image") {
            setMediaUrls((prev) => [...prev, { type: "image_url", image_url: { url }, fileType }]);
        } else if (fileType === "video") {
            setMediaUrls((prev) => [...prev, { type: "video_url", video_url: { url }, fileType }]);
        } else if (fileType === "audio") {
            setMediaUrls((prev) => [...prev, { type: "audio_url", audio_url: { url }, fileType }]);
        } else if (fileType === "other") {
            setMediaUrls((prev) => [...prev, { type: "file_url", file_url: { url }, fileType }]);
        }
    }, []);

    const handleFileRemoved = useCallback((url: string, fileType: SupportedFileType) => {
        // 删除时移除对应的媒体文件信息
        setMediaUrls((prev) =>
            prev.filter((media) => {
                const mediaUrl = media.image_url?.url || media.video_url?.url || media.audio_url?.url || media.file_url?.url;
                return mediaUrl !== url;
            })
        );
    }, []);

    const handleFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(event.target.files || []);
            const mediaFiles = selectedFiles;

            // 检查是否超过最大数量限制
            if (uploadedFiles.length + mediaFiles.length > MAX_FILES) {
                alert(`最多只能上传${MAX_FILES}个文件`);
                event.target.value = "";
                return;
            }

            for (const file of mediaFiles) {
                try {
                    const result = await client.upload(file);
                    if (result.data?.url) {
                        const fileType = getFileType(file);
                        if (fileType) {
                            const uploadedFile = { file, url: result.data.url, type: fileType };
                            setUploadedFiles((prev) => [...prev, uploadedFile]);
                            handleFileUploaded(result.data.url, fileType);
                        }
                    }
                } catch (error) {
                    console.error("Upload failed:", error);
                }
            }

            event.target.value = "";
        },
        [uploadedFiles.length, handleFileUploaded]
    );

    const removeFile = useCallback(
        (index: number) => {
            const fileToRemove = uploadedFiles[index];
            if (fileToRemove) {
                setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
                handleFileRemoved(fileToRemove.url, fileToRemove.type);
            }
        },
        [uploadedFiles, handleFileRemoved]
    );

    const value: FileListContextType = {
        uploadedFiles,
        mediaUrls,
        isFileTextMode,
        setIsFileTextMode,
        handleFileUploaded,
        handleFileRemoved,
        handleFileChange,
        removeFile,
        MAX_FILES,
    };

    return <FileListContext.Provider value={value}>{children}</FileListContext.Provider>;
};

const getFileType = (file: File): SupportedFileType => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "video/mp4") return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "other";
};
