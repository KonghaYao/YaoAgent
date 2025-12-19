import { createUITool, ToolManager } from "@langgraph-js/sdk";
import { useState, useRef } from "react";
import { z } from "zod";
import { UploadCloud, X, File, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TmpFilesClient } from "@/chat/FileUpload";

const WaitForUserToUploadFileSchema = {
    title: z.string().describe("Title for the upload section"),
    description: z.string().optional().describe("Optional description text"),
    accept: z.array(z.string()).optional().describe("Accepted file types (e.g., ['image/*', '.pdf', '.docx'])"),
    multiple: z.boolean().default(false).describe("Allow multiple file uploads"),
    max_size_mb: z.number().positive().optional().describe("Maximum file size in MB"),
    required: z.boolean().default(true).describe("Whether file upload is required"),
};

interface UploadedFileInfo {
    file_name: string;
    file_size: number;
    file_type: string;
    file_url: string;
}

export const wait_for_user_to_upload_file = createUITool({
    name: "wait_for_user_to_upload_file",
    description: "Wait for the user to upload one or more files.",
    parameters: WaitForUserToUploadFileSchema,
    handler: ToolManager.waitForUIDone,
    onlyRender: false,
    render(tool) {
        const data = tool.getInputRepaired();
        const [uploadedFiles, setUploadedFiles] = useState<UploadedFileInfo[]>([]);
        const [uploading, setUploading] = useState(false);
        const [error, setError] = useState<string>("");
        const fileInputRef = useRef<HTMLInputElement>(null);
        const client = new TmpFilesClient();
        const canInteract = tool.state === "interrupted" || tool.state === "loading";

        const formatFileSize = (bytes: number): string => {
            if (bytes === 0) return "0 Bytes";
            const k = 1024;
            const sizes = ["Bytes", "KB", "MB", "GB"];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
        };

        const validateFile = (file: File): string | null => {
            // 检查文件大小
            if (data.max_size_mb) {
                const maxSizeBytes = data.max_size_mb * 1024 * 1024;
                if (file.size > maxSizeBytes) {
                    return `文件大小超过限制 (最大 ${data.max_size_mb}MB)`;
                }
            }

            // 检查文件类型
            if (data.accept && data.accept.length > 0) {
                const fileType = (file.type || "").toLowerCase();
                const fileName = (file.name || "").toLowerCase();

                const normalize = (v: string) => v.trim().toLowerCase();

                const matches = data.accept.map(normalize).some((pattern) => {
                    // 全放行：*/* 或 *
                    if (pattern === "*/*" || pattern === "*") return true;

                    // 扩展名：.pdf / .docx
                    if (pattern.startsWith(".")) return fileName.endsWith(pattern);

                    // MIME 前缀：image/* -> image/
                    if (pattern.includes("/") && pattern.endsWith("/*")) {
                        const prefix = pattern.slice(0, -1); // keep trailing '/'
                        return fileType.startsWith(prefix);
                    }

                    // 精确 MIME：application/pdf
                    if (pattern.includes("/")) return fileType === pattern;

                    // 兜底：不认识的 pattern（不匹配）
                    return false;
                });

                if (!matches) {
                    return `不支持的文件类型。支持的类型: ${data.accept.join(", ")}`;
                }
            }

            return null;
        };

        const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(event.target.files || []);
            if (files.length === 0) return;

            setError("");
            setUploading(true);

            try {
                const uploadPromises = files.map(async (file) => {
                    const validationError = validateFile(file);
                    if (validationError) {
                        throw new Error(validationError);
                    }

                    const result = await client.upload(file);
                    if (!result.data?.url) {
                        throw new Error("上传失败：未返回文件 URL");
                    }

                    return {
                        file_name: file.name,
                        file_size: file.size,
                        file_type: file.type || "application/octet-stream",
                        file_url: result.data.url,
                    };
                });

                const uploaded = await Promise.all(uploadPromises);

                if (data.multiple) {
                    setUploadedFiles((prev) => [...prev, ...uploaded]);
                } else {
                    setUploadedFiles(uploaded);
                }

                // 如果不需要等待用户确认，自动提交
                if (!data.required || uploaded.length > 0) {
                    // 自动提交逻辑可以在这里添加
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "上传失败");
            } finally {
                setUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            }
        };

        const handleRemoveFile = (index: number) => {
            setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
        };

        const handleSubmit = () => {
            if (data.required && uploadedFiles.length === 0) {
                setError("请至少上传一个文件");
                return;
            }

            tool.sendResumeData({
                /** @ts-ignore */
                type: "respond",
                message: JSON.stringify(uploadedFiles),
            });
        };

        const handleReset = () => {
            setUploadedFiles([]);
            setError("");
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        };

        const isSubmitDisabled = !canInteract || (data.required && uploadedFiles.length === 0) || uploading;

        // 完成状态视图
        if (!canInteract && tool.output) {
            const outputFiles = typeof tool.output === "string" ? JSON.parse(tool.output) : tool.output;
            return (
                <div className="flex flex-col gap-2 my-1 p-3 bg-gray-50/50 border border-gray-200 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                            <CheckCircle className="w-3 h-3" />
                        </div>
                        <span className="font-medium">Files Uploaded</span>

                        <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={handleReset} title="Reset upload">
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm text-gray-600 pl-1">{data.title}</div>
                        {Array.isArray(outputFiles) && outputFiles.length > 0 && (
                            <div className="space-y-1.5">
                                {outputFiles.map((file: UploadedFileInfo, index: number) => (
                                    <div key={index} className="flex items-center gap-2 text-sm text-gray-900 bg-white px-3 py-2 rounded-lg border border-gray-200">
                                        <File className="w-4 h-4 text-blue-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{file.file_name}</div>
                                            <div className="text-xs text-gray-500">{formatFileSize(file.file_size)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // 交互状态视图
        return (
            <div className="w-full my-1 border border-gray-200 bg-white shadow-none rounded-xl overflow-hidden">
                <div className="pb-2 p-3 border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                                <UploadCloud className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900">File Upload Required</h3> {tool.state}
                        </div>
                        {uploadedFiles.length > 0 && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full" onClick={handleReset} title="Reset upload">
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                    </div>
                </div>
                <div className="p-3 space-y-3">
                    <div>
                        <label
                            className={cn(
                                "flex flex-col items-center justify-center w-full min-h-[180px] border-2 border-dashed rounded-lg cursor-pointer transition-colors p-6",
                                uploading ? "border-blue-300 bg-blue-50/50" : "border-gray-300 bg-gray-50/50 hover:border-blue-400 hover:bg-blue-50/30",
                                !canInteract && "opacity-50 cursor-not-allowed"
                            )}
                        >
                            <div className="flex flex-col items-center justify-center w-full space-y-3">
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                                        <p className="text-sm font-medium text-gray-700">上传中...</p>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-10 h-10 text-gray-400" />
                                        <div className="text-center space-y-1">
                                            <p className="text-sm font-medium text-gray-900">{data.title}</p>
                                            {data.description && <p className="text-xs text-gray-600">{data.description}</p>}
                                        </div>
                                        <div className="text-center space-y-0.5">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-semibold text-blue-600">点击上传</span> 或拖拽文件到此处
                                            </p>
                                            <p className="text-xs text-gray-500">{data.multiple ? "可上传多个文件" : "单个文件"}</p>
                                        </div>
                                        {(data.accept && data.accept.length > 0) || data.max_size_mb ? (
                                            <div className="pt-2 border-t border-gray-200 w-full">
                                                <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                                    {data.accept && data.accept.length > 0 && <span>支持类型: {data.accept.join(", ")}</span>}
                                                    {data.max_size_mb && <span>最大大小: {data.max_size_mb}MB</span>}
                                                </div>
                                            </div>
                                        ) : null}
                                    </>
                                )}
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept={data.accept?.join(",")}
                                multiple={data.multiple}
                                onChange={handleFileChange}
                                disabled={!canInteract || uploading}
                            />
                        </label>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                            <div className="text-xs font-medium text-gray-700">已上传的文件 ({uploadedFiles.length})</div>
                            <div className="space-y-1.5">
                                {uploadedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <File className="w-4 h-4 text-blue-500 shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-gray-900 truncate">{file.file_name}</div>
                                            <div className="text-xs text-gray-500">{formatFileSize(file.file_size)}</div>
                                        </div>
                                        {canInteract && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleRemoveFile(index)}
                                                title="Remove file"
                                            >
                                                <X className="h-3.5 w-3.5" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitDisabled}
                            className={cn(
                                "px-5 rounded-full transition-all duration-200",
                                isSubmitDisabled ? "bg-gray-100 text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-200"
                            )}
                        >
                            {uploadedFiles.length > 0 ? `Submit ${uploadedFiles.length} File${uploadedFiles.length > 1 ? "s" : ""}` : "Submit"}
                        </Button>
                    </div>
                </div>
            </div>
        );
    },
});
