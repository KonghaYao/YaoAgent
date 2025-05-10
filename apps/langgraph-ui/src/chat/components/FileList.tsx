import React, { useState, useCallback } from "react";
import { TmpFilesClient } from "../FileUpload";
import "./FileList.css";

interface FileListProps {
    onFileUploaded: (url: string) => void;
}

const FileList: React.FC<FileListProps> = ({ onFileUploaded }) => {
    const [files, setFiles] = useState<File[]>([]);
    const client = new TmpFilesClient();
    const MAX_FILES = 3;

    const handleFileChange = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = Array.from(event.target.files || []);
            const imageFiles = selectedFiles.filter((file) => file.type.startsWith("image/"));
            
            // 检查是否超过最大数量限制
            if (files.length + imageFiles.length > MAX_FILES) {
                alert(`最多只能上传${MAX_FILES}张图片`);
                event.target.value = "";
                return;
            }

            setFiles((prev) => [...prev, ...imageFiles]);

            for (const file of imageFiles) {
                try {
                    const result = await client.upload(file);
                    if (result.data?.url) {
                        onFileUploaded(result.data.url);
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
        <div className="file-list">
            {files.length < MAX_FILES && (
                <label className={`file-upload-button ${files.length === 0 ? "empty" : ""}`}>
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z"/>
                        <path d="M20 4h-3.17l-1.24-1.35A1.99 1.99 0 0 0 14.12 2H9.88c-.56 0-1.1.24-1.48.65L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                    </svg>
                    <input type="file" accept="image/*" multiple onChange={handleFileChange} style={{ display: "none" }} />
                </label>
            )}
            <div className="file-list-content">
                {files.map((file, index) => (
                    <div key={index} className="file-item">
                        <img src={URL.createObjectURL(file)} alt={file.name} className="file-preview" />
                        <button className="remove-button" onClick={() => removeFile(index)}>
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileList;
