import React from "react";
import { PlusIcon, UploadCloudIcon } from "lucide-react";
import { useFileList } from "./FileListContext";

const UploadButton: React.FC = () => {
    const { uploadedFiles, handleFileChange, MAX_FILES } = useFileList();

    return (
        <>
            {uploadedFiles.length < MAX_FILES && (
                <label className={`inline-flex items-center justify-center text-gray-700 bg-white rounded-xl cursor-pointer transition-colors hover:bg-gray-200 w-8 h-8`}>
                    <PlusIcon size={20} />
                    <input type="file" accept="*" multiple onChange={handleFileChange} className="hidden" />
                </label>
            )}
        </>
    );
};

export default UploadButton;
