import React, { useState, useCallback } from 'react';
import { TmpFilesClient } from '../FileUpload';
import './FileList.css';

interface FileListProps {
    onFileUploaded: (url: string) => void;
}

const FileList: React.FC<FileListProps> = ({ onFileUploaded }) => {
    const [files, setFiles] = useState<File[]>([]);
    const client = new TmpFilesClient();

    const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
        setFiles(prev => [...prev, ...imageFiles]);
        
        for (const file of imageFiles) {
            try {
                const result = await client.upload(file);
                if (result.data?.url) {
                    onFileUploaded(result.data.url);
                }
            } catch (error) {
                console.error('Upload failed:', error);
            }
        }
        
        // 清空 input 值，允许重复选择相同文件
        event.target.value = '';
    }, [onFileUploaded]);

    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    return (
        <div className="file-list">
            <div className="file-list-content">
                <label className="file-upload-button">
                    <span>+</span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                    />
                </label>
                {files.map((file, index) => (
                    <div key={index} className="file-item">
                        <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="file-preview"
                        />
                        <button
                            className="remove-button"
                            onClick={() => removeFile(index)}
                        >
                            ×
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileList; 