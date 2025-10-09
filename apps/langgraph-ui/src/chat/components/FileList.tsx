import React, { useState, useCallback } from "react";
import { TmpFilesClient } from "../FileUpload";
import { File, UploadCloudIcon } from "lucide-react";

export type SupportedFileType = "image" | "video" | "audio" | "other";

const getFileType = (file: File): SupportedFileType => {
    if (file.type.startsWith("image/")) return "image";
    if (file.type === "video/mp4") return "video";
    if (file.type.startsWith("audio/")) return "audio";
    return "other";
};

interface UploadedFile {
    file: File;
    url: string;
    type: SupportedFileType;
}

interface FileListProps {
    onFileUploaded: (url: string, type: SupportedFileType) => void;
    onFileRemoved: (url: string, type: SupportedFileType) => void;
}

const FileList: React.FC<FileListProps> = ({ onFileUploaded, onFileRemoved }) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const client = new TmpFilesClient();
    const MAX_FILES = 3;

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
                            onFileUploaded(result.data.url, fileType);
                        }
                    }
                } catch (error) {
                    console.error("Upload failed:", error);
                }
            }

            event.target.value = "";
        },
        [onFileUploaded, uploadedFiles.length]
    );

    const removeFile = useCallback(
        (index: number) => {
            const fileToRemove = uploadedFiles[index];
            if (fileToRemove) {
                setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
                onFileRemoved(fileToRemove.url, fileToRemove.type);
            }
        },
        [uploadedFiles, onFileRemoved]
    );

    return (
        <div className="flex gap-2 flex-1">
            {uploadedFiles.length < MAX_FILES && (
                <label
                    className={`inline-flex items-center justify-center text-gray-700 bg-white border border-gray-200 rounded-xl cursor-pointer transition-colors hover:bg-gray-100 hover:border-gray-300 ${uploadedFiles.length === 0 ? "w-10 h-10" : "w-20 h-20"}`}
                >
                    <UploadCloudIcon size={uploadedFiles.length === 0 ? 20 : 32} />
                    <input type="file" accept="*" multiple onChange={handleFileChange} className="hidden" />
                </label>
            )}
            <div className="flex flex-wrap gap-2">
                {uploadedFiles.map((uploadedFile, index) => {
                    const { file, type: fileType, url } = uploadedFile;

                    return (
                        <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200">
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
