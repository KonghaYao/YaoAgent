import React from "react";
import UploadButton from "./UploadButton";
import FileList from "./FileList";

const FileListContainer: React.FC = () => {
    return (
        <div className="flex gap-2 flex-1">
            <UploadButton />
            <FileList />
        </div>
    );
};

export default FileListContainer;
