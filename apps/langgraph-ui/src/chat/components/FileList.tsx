import React, { useState, useCallback } from "react";
import { TmpFilesClient } from "../FileUpload";

export type SupportedFileType = "image" | "video" | "audio" | "other";

const getFileType = (file: File): SupportedFileType => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "video/mp4") return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "other";
};

interface FileListProps {
    onFileUploaded: (url: string, type: SupportedFileType) => void;
}

const FileList: React.FC<FileListProps> = ({ onFileUploaded }) => {
    const [files, setFiles] = useState<File[]>([]);
    const client = new TmpFilesClient();
    const MAX_FILES = 3;

    const handleFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(event.target.files || []);
            const mediaFiles = selectedFiles;

            // 检查是否超过最大数量限制
            if (files.length + mediaFiles.length > MAX_FILES) {
                alert(`最多只能上传${MAX_FILES}个文件`);
                event.target.value = "";
                return;
            }

            setFiles((prev) => [...prev, ...mediaFiles]);

            for (const file of mediaFiles) {
                try {
                    const result = await client.upload(file);
                    if (result.data?.url) {
                        const fileType = getFileType(file);
                        if (fileType) {
                            onFileUploaded(result.data.url, fileType);
                        }
                    }
                } catch (error) {
                    console.error("Upload failed:", error);
                }
            }

            event.target.value = "";
        },
        [onFileUploaded, files.length]
    );

    const removeFile = useCallback((index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }, []);

    return (
        <div className="flex gap-2 flex-1">
            {files.length < MAX_FILES && (
                <label
                    className={`inline-flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl cursor-pointer transition-colors hover:bg-gray-100 ${files.length === 0 ? "w-10 h-10" : "w-20 h-20"}`}
                >
                    <svg viewBox="0 0 24 24" width={files.length === 0 ? "20" : "32"} height={files.length === 0 ? "20" : "32"} fill="currentColor">
                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                        <path d="M20 4h-3.17l-1.24-1.35A1.99 1.99 0 0 0 14.12 2H9.88c-.56 0-1.1.24-1.48.65L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                    </svg>
                    <input type="file" accept="*" multiple onChange={handleFileChange} className="hidden" />
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {files.map((file, index) => {
                    const fileType = getFileType(file);

                    return (
                        <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden">
                            {fileType === "image" ? (
                                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-full object-cover" />
                            ) : fileType === "video" ? (
                                <video src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                            ) : fileType === "audio" ? (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-gray-500">
                                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                                    </svg>
                                </div>
                            ) : fileType === "other" ? (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className="text-gray-500">
                                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                                    </svg>
                                </div>
                            ) : null}
                            <button
                                className="absolute top-1 right-1 w-5 h-5 bg-red-500/90 text-white rounded-full flex items-center justify-center text-sm leading-none hover:bg-red-600 transition-colors backdrop-blur-sm"
                                onClick={() => removeFile(index)}
                            >
                                ×
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default FileList;
