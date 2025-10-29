import React from "react";
import { useFileList } from "./FileListContext";

export type SupportedFileType = "image" | "video" | "audio" | "other";

const FileList: React.FC = () => {
    const { uploadedFiles, removeFile, mediaUrls, setIsFileTextMode, isFileTextMode } = useFileList();

    return (
        <div>
            {mediaUrls.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-600 mb-3" title="文本传输将会把多模态文件转为 XML + URL 的格式传递给大模型">
                    <span>启动文本传输:</span>
                    <button
                        onClick={() => setIsFileTextMode((prev) => ({ ...prev, image: !prev.image }))}
                        className={`px-2 py-1 rounded ${isFileTextMode.image ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                    >
                        图片
                    </button>
                    <button
                        onClick={() => setIsFileTextMode((prev) => ({ ...prev, video: !prev.video }))}
                        className={`px-2 py-1 rounded ${isFileTextMode.video ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                    >
                        视频
                    </button>
                    <button
                        onClick={() => setIsFileTextMode((prev) => ({ ...prev, audio: !prev.audio }))}
                        className={`px-2 py-1 rounded ${isFileTextMode.audio ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                    >
                        音频
                    </button>
                    <button
                        onClick={() => setIsFileTextMode((prev) => ({ ...prev, other: !prev.other }))}
                        className={`px-2 py-1 rounded ${isFileTextMode.other ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}
                    >
                        其他
                    </button>
                </div>
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
            </div>{" "}
        </div>
    );
};

export default FileList;
